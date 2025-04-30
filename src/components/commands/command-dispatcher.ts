import {AggregateRoot} from "../aggregate/aggregate";
import {EventSinkExecutor} from "../events/avent-sink-executor";
import {DomainEvent} from "../events/events";
import {GenericCommandHandler, GenericCommandHandlerInterface} from "./baseCommandHandler";
import {Command} from "./command";
import {CommandHandlerFactory} from "./command-handler-factory";

export interface DispatchResult<TAggregate extends AggregateRoot> {
  aggregate: TAggregate;
  events: DomainEvent[];
  metadata?: Record<string, any>;
}

type AnyObject = { [key: string]: any; [key: symbol]: any };

type MiddlewareFunction = (command: Command) => Promise<DispatchResult<any>>;

export interface DispatchOptions {
  trace?: (info: { type: string; data: any }) => void;
}

export type CommandMiddleware = (
  command: any,
  next: (command: any) => Promise<DispatchResult<any>>
) => Promise<DispatchResult<any>>;
export class CommandDispatcherBuilder {
  private middlewares: CommandMiddleware[] = [];
  private sinks: EventSinkExecutor;
  private handler: GenericCommandHandlerInterface;

  constructor(private readonly factory: CommandHandlerFactory) {
    this.sinks = new EventSinkExecutor(factory);
    this.handler = new GenericCommandHandler(factory);
    this.middlewares = [];
  }

  withMiddlewares(middlewares: CommandMiddleware[]): CommandDispatcherBuilder {
    this.middlewares = [...this.middlewares, ...middlewares];
    return this;
  }

  withEventSinks(sinks: EventSinkExecutor): CommandDispatcherBuilder {
    this.sinks = sinks;
    return this;
  }

  withCommandHandler(handler: GenericCommandHandlerInterface): CommandDispatcherBuilder {
    this.handler = handler;
    return this;
  }

  build(): CommandDispatcher {
    return new CommandDispatcher(
      this.factory,
      this.middlewares,
      this.sinks,
      this.handler
    );
  }
}

export class CommandDispatcher {
  constructor(
    private readonly factory: CommandHandlerFactory,
    private readonly middlewares: CommandMiddleware[] = [],
    private readonly sinks = new EventSinkExecutor(factory),
    private readonly handler: GenericCommandHandlerInterface = new GenericCommandHandler(factory)
  ) {}

  async dispatch<T extends AggregateRoot>(
    command: Command,
    options: { trace?: (info: { type: string; data: any }) => void } = {}
  ): Promise<DispatchResult<T>> {
    const trace = options.trace ?? (() => {});

    const execute = async (cmd: Command): Promise<DispatchResult<T>> => {
      // Execute the command and get the result
      const result = await this.handler.handle<T>(cmd);
      
      // Process events after command execution
      for (const event of result.events) {
        trace({ type: 'event.applied', data: { event } });
        await this.sinks.run(event, result.aggregate, cmd);
      }
      
      return result;
    };

    const middlewareChain = this.middlewares.reduceRight<MiddlewareFunction>(
      (next, middleware) => async (cmd) => {
        trace({ type: 'middleware.executing', data: { middleware: middleware.name || 'anonymous' } });
        try {
          const result = await middleware(cmd, next);
          trace({ type: 'middleware.completed', data: { middleware: middleware.name || 'anonymous' } });
          return result;
        } catch (error) {
          trace({ type: 'middleware.failed', data: { middleware: middleware.name || 'anonymous', error } });
          throw error;
        }
      },
      execute
    );

    try {
      return await middlewareChain(command);
    } catch (error) {
      trace({ type: 'command.failed', data: { command, error } });
      throw error;
    }
  }
}