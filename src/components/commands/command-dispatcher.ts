import { AggregateRoot } from "../aggregate/aggregate";
import { isAggregateRoot } from "../aggregate/aggregate-annotation";
import { getAggregateCommandHandlers } from "../aggregate/aggregate-command";
import { EventSinkExecutor } from "../events/avent-sink-executor";
import { getConventionReducers, getExplicitReducersAll } from "../events/event-reducer";
import { DomainEvent } from "../events/events";
import { CommandHandlerResult, GenericCommandHandler, GenericCommandHandlerInterface } from "./baseCommandHandler";
import { Command } from "./command";
import { getAggregateTypeForCommand, isConstructorCommand } from "./command-annotation";
import { getHandlerForCommand } from "./command-handler-annotation";
import { CommandHandler, CommandHandlerFactory } from "./command-handler-factory";

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
    const aggregateType = getAggregateTypeForCommand(command);
    if (!aggregateType || !isAggregateRoot(aggregateType)) {
      throw new Error(`No se pudo inferir el AggregateRoot desde el comando ${command.type}`);
    }

    const trace = options.trace ?? (() => {});

    const execute = async (cmd: Command): Promise<DispatchResult<T>> => {
      const result: CommandHandlerResult<T> = await this.handler.handle(cmd);

      for (const event of result.events) {
        trace({ type: 'event.applied', data: { event } });
        await this.sinks.run(event);
      }

      return { aggregate: result.state, events: result.events };
    };

    const middlewareChain = this.middlewares.reduceRight<MiddlewareFunction>(
      (next, middleware) => (cmd) => middleware(cmd, next),
      execute
    );

    return middlewareChain(command);
  }
}