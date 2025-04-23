import { StateStore } from "../../infraestructure/statestore";
import { DomainEvent } from "../events/events";
import { Command } from "./command";
import { EventStore } from "../../infraestructure/eventstore";
import { AggregateRoot } from "../aggregate/aggregate";

export interface CommandHandler<TCommand extends Command = Command, TAggregate extends AggregateRoot = AggregateRoot> {
  execute(aggregate: TAggregate, command: TCommand): Promise<DomainEvent[] | DomainEvent>;
}


export interface CommandHandlerFactory {
    create<T>(type: new (...args: any[]) => T): T;
    getStateStore(): StateStore;
    getEventStore(): EventStore;
}