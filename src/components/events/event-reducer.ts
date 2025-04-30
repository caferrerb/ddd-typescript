import 'reflect-metadata';

const EXPLICIT_REDUCERS_KEY = Symbol('ddd:explicitReducers');

export function reducer(eventType: Function): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
    const constructor = target.constructor;
    const originalMethod = descriptor.value;
    const existing: Map<Function, string[]> = Reflect.getMetadata(EXPLICIT_REDUCERS_KEY, constructor) || new Map();
    
    const handlers = existing.get(eventType) || [];
    handlers.push(propertyKey as string);
    existing.set(eventType, handlers);

    Reflect.defineMetadata(EXPLICIT_REDUCERS_KEY, existing, constructor);

    descriptor.value = function (...args: any[]) {
      const result = originalMethod.apply(this, args);
      return result;
    };
    return descriptor;
  };
}

export function getExplicitReducersAll(target: Function): Map<Function, string[]> {
  return Reflect.getMetadata(EXPLICIT_REDUCERS_KEY, target) || new Map();
}


export function getConventionReducers(target: Function): Set<string> {
    const prototype = target.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype);
    const reducerMethods = methodNames.filter(name => /^on[A-Z]/.test(name) && typeof prototype[name] === 'function');
    return new Set(reducerMethods);
  }