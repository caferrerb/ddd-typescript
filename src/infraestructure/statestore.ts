export interface StateStore {
    get<T>(aggregateType: Function, id: string): Promise<T | null>;
    save<T>(aggregateType: Function, id: string, state: T): Promise<void>;
  }