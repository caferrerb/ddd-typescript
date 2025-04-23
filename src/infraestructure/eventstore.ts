import { DomainEvent } from "../components/events/events";

export interface EventStore {
    getEvents(aggregateType: Function, id: string): Promise<DomainEvent[]>;
    appendEvents(aggregateType: Function, id: string, events: DomainEvent[]): Promise<void>;
  }