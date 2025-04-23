import { CommandHandlerFactory } from "../commands/command-handler-factory";
import { getEventSinksFor } from "./event-sink-annotation";

export interface EventSinkExecutorOptions {
  failFast?: boolean;
  trace?: (info: { type: string; data: any }) => void;
}

export interface EventSinkHandler<TEvent = any> {
    handle(event: TEvent): Promise<void> | void;
  }

export class EventSinkExecutor {
  constructor(
    private readonly factory: CommandHandlerFactory,
    private readonly options: EventSinkExecutorOptions = {}
  ) {}

  async run(event: any): Promise<void> {
    const metadata = getEventSinksFor(event.constructor);
    const trace = this.options.trace ?? (() => {});
    const failFast = this.options.failFast ?? false;

    const executions = metadata.map(async ({ sinkType, condition }) => {
      if (condition && !condition(event)) return;

      const instance = this.factory.create(sinkType as new (...args: any[]) => EventSinkHandler) as EventSinkHandler;
      trace({ type: 'event.sink.invoked', data: { sink: sinkType.name, event } });

      try {
        await instance.handle(event);
      } catch (err) {
        trace({ type: 'event.sink.failed', data: { sink: sinkType.name, error: err } });
        if (failFast) throw err;
      }
    });

    await Promise.all(executions);
  }
}