import { CommandHandlerFactory } from "../commands/command-handler-factory";
import { getEventSinksFor } from "./event-sink-annotation";
import {DomainEvent} from "@/components/events/events";
import {AggregateRoot} from "@/components/aggregate/aggregate";

export interface EventSinkExecutorOptions {
  failFast?: boolean;
  trace?: (info: { type: string; data: any }) => void;
}

export interface EventSinkHandler<TEvent extends DomainEvent= any, Aggregate extends AggregateRoot = AggregateRoot> {
    handle(event: TEvent, aggregate: Aggregate): Promise<void> | void;
    couldBeTriggered?(event: TEvent, aggregate: Aggregate): Promise<boolean> | boolean;
}

export class EventSinkExecutor {
  constructor(
    private readonly factory: CommandHandlerFactory,
    private readonly options: EventSinkExecutorOptions = {}
  ) {}

  async run(event: DomainEvent, aggregate: AggregateRoot): Promise<void> {
    const metadata = getEventSinksFor(event.constructor);
    const trace = this.options.trace ?? (() => {});
    const failFast = this.options.failFast ?? false;

    const executions = metadata.map(async ({ sinkType }) => {

      const instance: EventSinkHandler = this.factory.create(sinkType as new (...args: any[]) => EventSinkHandler);
      trace({ type: 'event.sink.invoked', data: { sink: sinkType.name, event } });

      try {
        const couldBeTriggered = instance.couldBeTriggered ? (await instance.couldBeTriggered(event, aggregate)) : true;
        if (!couldBeTriggered) return

        await instance.handle(event, aggregate);
      } catch (err) {
        trace({ type: 'event.sink.failed', data: { sink: sinkType.name, error: err } });
        if (failFast) throw err;
      }
    });

    await Promise.all(executions);
  }
}