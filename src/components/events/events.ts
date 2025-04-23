export interface Metadata {
    readonly aggregateId?: string;
    readonly commandId?: string;
    readonly aggregateType?: string;
    readonly eventId?: string;
    readonly timestamp?: string;
    readonly userId?: string;
    readonly correlationId?: string;
    [key: string]: any;
  }
  
export interface DomainEvent<T = any, M extends Metadata = Metadata> {
    readonly type: string;
    data: T;
    metadata?: M;
  }