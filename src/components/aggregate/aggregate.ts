import {getConventionReducers, getExplicitReducersAll} from "../events/event-reducer";
import {DomainEvent} from "../events/events";
import {v4 as uuidv4} from 'uuid';

export abstract class AggregateRoot<TState = any> {
    private readonly _pendingEvents: DomainEvent[] = [];
    private readonly _appliedEventIds = new Set<string>();
    protected readonly _id: string;
    protected state: TState;

    constructor(id?: string, state?: TState) {
        this.state = state ?? {} as TState;
        this._id = id ?? uuidv4();
    }

    protected apply(event: DomainEvent) {
        const eventId = event.metadata?.eventId;
        if (this._appliedEventIds.has(eventId)) return;
    
        this.when(event);
        this._pendingEvents.push(event);
        this._appliedEventIds.add(eventId); 
    }
  
    get pendingEvents(): DomainEvent[] {
      return [...this._pendingEvents];
    }

    getState(): TState {
      return this.state;
    }
  
    clearEvents(): void {
      this._pendingEvents.length = 0;
      this._appliedEventIds.clear();
    }
  
    protected when(event: DomainEvent): void {
        const aggregateType = this.constructor as Function;
        const reducers = getExplicitReducersAll(aggregateType);
        const conventions = getConventionReducers(aggregateType);
    
        const handlerNames = reducers.get(event.constructor) || [];
        for (const methodName of handlerNames) {
          (this as any)[methodName](event);
        }
    
        const conventionName = `on${event.constructor.name}`;
        if (conventions.has(conventionName) && typeof (this as any)[conventionName] === 'function') {
          (this as any)[conventionName](event);
        }
    }
  
    abstract serialize(): Record<string, any>;
    abstract deSerialize(state: Record<string, any>): TState;

    toJSON(): Record<string, any> {
        const json = this.serialize();
        return {
            id: this._id,
            ...json,
        };
    }

    loadFrom(json: Record<string, any>) {
        const {id, ...jsonstate}  = json;
        this.state = this.deSerialize(jsonstate);
    }

    static fromJSON<T extends AggregateRoot<any>>(this: new (id?: string, state?: any) => T, json: Record<string, any>): T {
      const instance = new this();
      const {id, ...jsonstate}  = json;
      const state = instance.deSerialize(json);
      return new this(id, jsonstate);
    }
  }