import {EventStore} from "../infraestructure/eventstore";
import {DomainEvent} from "../components/events/events";
import {StateStore} from "../infraestructure/statestore";

export class InMemoryEventStore implements EventStore {
    private readonly store: Map<string, DomainEvent[]> = new Map();
    
    private _getStreamId(aggregateType: Function, aggregateId: string): string {    
        return `${aggregateType.name}-${aggregateId}`;
    }
    
    async getEvents(_: Function, aggregateId: string): Promise<DomainEvent[]> {
      return this.store.get(this._getStreamId(_, aggregateId)) || [];
    }
  
    async appendEvents(_: Function, aggregateId: string, events: DomainEvent[]): Promise<void> {
      const existing = this.store.get(this._getStreamId(_, aggregateId)) || [];
      this.store.set(this._getStreamId(_, aggregateId), [...existing, ...events]);
    }
    async delete() {
        this.store.clear();
    }
  }
  
  export class InMemoryStateStore implements StateStore {
    private map: Map<string, any> = new Map();
    private _getStateId(aggregateType: Function, aggregateId: string): string {
        return `${aggregateType.name}-${aggregateId}`;
    }

    async get<T>(aggregateType: Function, aggregateId: string): Promise<T | null> {
      return this.map.get(this._getStateId(aggregateType, aggregateId)) || null;
    }
  
    async save<T>(aggregateType: Function, aggregateId: string, state: T): Promise<void> {
      this.map.set(this._getStateId(aggregateType, aggregateId), state);
    }

    async flush() {
        this.map.clear();
    }
  }