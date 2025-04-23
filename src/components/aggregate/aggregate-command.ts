import 'reflect-metadata';
import { METADATA_KEYS } from '../reflection';

export function AggregateCommandHandler(commandType: Function): MethodDecorator {
  return (target, propertyKey) => {
    const handlers = Reflect.getMetadata(METADATA_KEYS.AGGREGATE_COMMAND_HANDLER, target.constructor) || [];
    handlers.push({ methodName: propertyKey, commandType });
    Reflect.defineMetadata(METADATA_KEYS.AGGREGATE_COMMAND_HANDLER, handlers, target.constructor);
  };
}

export function getAggregateCommandHandlers(target: Function): Array<{
    methodName: string | symbol;
    commandType: Function;
  }> {
    return Reflect.getMetadata(METADATA_KEYS.AGGREGATE_COMMAND_HANDLER, target) || [];
  }