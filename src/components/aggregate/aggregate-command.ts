import 'reflect-metadata';
import {METADATA_KEYS} from '../reflection';

export function aggregateCommandHandler(): MethodDecorator {
  return (target, propertyKey) => {
    const methodName = propertyKey.toString();
    const handlers = Reflect.getMetadata(METADATA_KEYS.AGGREGATE_COMMAND_HANDLER, target.constructor) || [];
    handlers.push({ methodName });
    Reflect.defineMetadata(METADATA_KEYS.AGGREGATE_COMMAND_HANDLER, handlers, target.constructor);
  };
}

export function getAggregateCommandHandlers(target: Function): Array<{
    methodName: string;
  }> {
    return Reflect.getMetadata(METADATA_KEYS.AGGREGATE_COMMAND_HANDLER, target) || [];
  }