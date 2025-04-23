import 'reflect-metadata';
import { METADATA_KEYS } from '../reflection';

export function Reducer(eventType: Function): MethodDecorator {
  return (target, propertyKey) => {
    const reducers = Reflect.getMetadata(METADATA_KEYS.REDUCER, target.constructor) || [];
    reducers.push({ methodName: propertyKey, eventType });
    Reflect.defineMetadata(METADATA_KEYS.REDUCER, reducers, target.constructor);
  };
}

export function getExplicitReducersAll(target: Function): Map<Function, Array<string | symbol>> {
    const reducers = Reflect.getMetadata(METADATA_KEYS.REDUCER, target) || [];
    const map = new Map<Function, Array<string | symbol>>();
    for (const { eventType, methodName } of reducers) {
      if (!map.has(eventType)) {
        map.set(eventType, []);
      }
      map.get(eventType)!.push(methodName);
    }
    return map;
  }


export function getConventionReducers(target: Function): Set<string> {
    const prototype = target.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype);
    const reducerMethods = methodNames.filter(name => /^on[A-Z]/.test(name) && typeof prototype[name] === 'function');
    return new Set(reducerMethods);
  }