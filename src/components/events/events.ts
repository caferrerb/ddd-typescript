import { v4 as uuidv4 } from 'uuid'; // Librería UUID para generar IDs únicos

export interface Metadata {
  readonly eventId: string;
  readonly timestamp: string;
  readonly userId?: string;
  readonly correlationId?: string;
  readonly aggregateId?: string;
  [key: string]: any;
}

export abstract class DomainEvent<T = any, M extends Metadata = Metadata> {
  public readonly metadata: M;

  constructor(
    public readonly type: string,
    public readonly data: T,
    metadata?: Partial<M>
  ) {
    const now = new Date();
    this.metadata = {
      eventId: metadata?.eventId ?? uuidv4(),
      timestamp: metadata?.timestamp ?? now.toISOString(),
      ...metadata,
    } as M;
  }

  toJSON(): { type: string; data: T; metadata: M } {
    return {
      type: this.type,
      data: this.data,
      metadata: this.metadata,
    };
  }

  summary(): Record<string, any> {
    return {
      type: this.type,
      eventId: this.metadata.eventId,
      timestamp: this.metadata.timestamp,
      ...(this.metadata.aggregateId && { aggregateId: this.metadata.aggregateId }),
    };
  }
}