import { getConventionReducers, getExplicitReducersAll } from "../events/event-reducer";
import { DomainEvent } from "../events/events";
import { v4 as uuidv4 } from 'uuid';

export abstract class AggregateRoot<TState = any> {
    private readonly _pendingEvents: DomainEvent[] = [];
    private readonly _appliedEventIds = new Set<string>();
    protected readonly _id: string;
    protected state: TState;

    constructor(id?: string) {
        this.state = {} as TState;
        this._id = id ?? uuidv4();
    }

    protected apply(event: DomainEvent) {
        if (!event.metadata?.eventId) {
            event.metadata = {
                eventId: uuidv4()
            }
        }
        const eventId = event.metadata?.eventId ?? '';
        if (this._appliedEventIds.has(eventId)) return;
    
        this.when(event);
        this._pendingEvents.push(event);
        this._appliedEventIds.add(eventId); 
    }
  
    get pendingEvents(): DomainEvent[] {
      return [...this._pendingEvents];
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
  
    toJSON(): Record<string, any> {
      const { _pendingEvents, ...rest } = this as any;
      return JSON.parse(JSON.stringify(rest));
    }
  
    loadFrom(state: Record<string, any>): void {
      Object.assign(this, state);
    }
  
    /** Alternativa de fábrica */
    static fromJSON<T extends AggregateRoot<any>>(this: new () => T, json: Record<string, any>): T {
      const instance = new this();
      instance.loadFrom(json);
      return instance;
    }
  }