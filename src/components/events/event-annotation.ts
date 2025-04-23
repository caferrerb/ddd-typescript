import 'reflect-metadata';
import { METADATA_KEYS } from '../reflection';

export function Event(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(METADATA_KEYS.EVENT, true, target);
  };
}