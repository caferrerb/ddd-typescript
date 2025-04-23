// === annotations/Command.ts ===
import 'reflect-metadata';
import { METADATA_KEYS } from '../reflection';
interface CommandOptions {
  aggregate: Function;
  isConstructor?: boolean;
}

export function Command({ aggregate, isConstructor = false }: CommandOptions): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEYS.COMMAND, true, target);
    Reflect.defineMetadata('ddd:command:aggregateType', aggregate, target);
    Reflect.defineMetadata('ddd:command:isConstructor', isConstructor, target);
  };
}

export function getAggregateTypeForCommand(command: any): Function | undefined {
    return Reflect.getMetadata('ddd:command:aggregateType', command.constructor);
}

export function isConstructorCommand(command: any): boolean {
    return Reflect.getMetadata('ddd:command:isConstructor', command.constructor) === true;
  }