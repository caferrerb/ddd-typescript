export interface CommandMetadata {
    commandId?: string;
    timestamp?: string;
    userId?: string;
    correlationId?: string;
    [key: string]: any;
  }
  
  export interface Command<T = any, M = CommandMetadata> {
    readonly type: string;
    data: T;
    metadata?: M;
  }