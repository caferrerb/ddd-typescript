import 'reflect-metadata';

const EVENT_SINKS_KEY = 'ddd:event:sinks';

export interface EventSinkOptions {
  event: Function;
  condition?: (event: any) => boolean;
}

export function EventSink(options: EventSinkOptions): ClassDecorator {
  return (target) => {
    const sinks = Reflect.getMetadata(EVENT_SINKS_KEY, options.event) || [];
    sinks.push({ sinkType: target, condition: options.condition });
    Reflect.defineMetadata(EVENT_SINKS_KEY, sinks, options.event);
  };
}

export function getEventSinksFor(event: Function): Array<{
  sinkType: Function;
  condition?: (event: any) => boolean;
}> {
  return Reflect.getMetadata(EVENT_SINKS_KEY, event) || [];
}

export function getAllEventSinks(): Array<{
  sinkType: Function;
  condition?: (event: any) => boolean;
}> {
  return Reflect.getMetadata(EVENT_SINKS_KEY, Reflect) || [];
}
