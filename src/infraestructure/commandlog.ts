import {CommandMiddleware} from '../components/commands/command-dispatcher';
import {Command} from '../components/commands/command';
import crypto from 'crypto';

export interface CommandLogStore {
    save(command: Command, status: string): Promise<void>;
  }

export interface CommandWriter {
  write(tableName: string, values: Record<string, any>): Promise<void>;
}

export class SqlCommandLogStore implements CommandLogStore {
  constructor(private readonly writer: CommandWriter, private readonly tableName = 'command_log') {}

  async save(command: Command, status: string): Promise<void> {
    await this.writer.write(this.tableName, {
      id: command.metadata?.commandId ?? crypto.randomUUID(),
      executed_at: command.metadata?.timestamp ?? new Date().toISOString(),
      name: command.type,
      data: JSON.stringify(command.data),
      status: status,
      metadata: JSON.stringify(command.metadata ?? {})
    });
  }
}

export function logCommandMiddleware(logStore: CommandLogStore): CommandMiddleware {
  return async (command, next) => {
    try {
      const result = await next(command);
      await logStore.save(command, 'succeeded');
      return result;
    } catch (error) {
      await logStore.save(command, 'failed');
      throw error;
    }
  };
}

export function getCommandLogTableSQL(tableName = 'command_log'): string {
  return `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id VARCHAR PRIMARY KEY,
      executed_at TIMESTAMP NOT NULL,
      name VARCHAR NOT NULL,
      status VARCHAR NOT NULL,
      data JSONB NOT NULL,
      metadata JSONB
    );
  `;
}

export function dropCommandLogTableSQL(tableName = 'command_log'): string {
  return `DROP TABLE IF EXISTS ${tableName};`;
}
