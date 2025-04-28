import 'reflect-metadata';
import { METADATA_KEYS } from '../reflection';

export function domainEvent(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEYS.EVENT, true, target);
    Reflect.defineMetadata('ddd:event:aggregateType', target, target);
  };
}

export function getAggregateTypeForEvent(event: any): Function | undefined {
    return Reflect.getMetadata('ddd:event:aggregateType', event.constructor);
}