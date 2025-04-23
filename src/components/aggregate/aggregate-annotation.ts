import 'reflect-metadata';
import { METADATA_KEYS } from '../reflection';

export function AggregateRoot(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEYS.AGGREGATE_ROOT, true, target);
  };
}

export function isAggregateRoot(target: Function): boolean {
    return Reflect.getMetadata(METADATA_KEYS.AGGREGATE_ROOT, target) === true;
}