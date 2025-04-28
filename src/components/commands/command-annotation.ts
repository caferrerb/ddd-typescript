// === annotations/Command.ts ===
import 'reflect-metadata';
import { METADATA_KEYS } from '../reflection';
import { AggregateRoot } from '../aggregate/aggregate';

interface CommandOptions {
  aggregate: string;
  isConstructor?: boolean;
  methodName?: string;
}

export function command(options: CommandOptions): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEYS.COMMAND, true, target);
    Reflect.defineMetadata('ddd:command:aggregateType', options.aggregate, target);
    Reflect.defineMetadata('ddd:command:isConstructor', options.isConstructor, target);
    Reflect.defineMetadata('ddd:command:methodName', options.methodName, target);
  };
}

export function getAggregateNameForCommand(command: any): string {
  return Reflect.getMetadata('ddd:command:aggregateType', command.constructor);
}

export function isConstructorCommand(command: any): boolean {
  return Reflect.getMetadata('ddd:command:isConstructor', command.constructor) === true;
}

export function getMethodNameForCommand(command: any): string | undefined {
  return Reflect.getMetadata('ddd:command:methodName', command.constructor);
}