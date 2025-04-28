import 'reflect-metadata';

const EVENT_SINKS_KEY = 'ddd:event:sinks';

export function EventSink(event: Function): ClassDecorator {
  return (target) => {
    const sinks = Reflect.getMetadata(EVENT_SINKS_KEY, event) || [];
    sinks.push({ sinkType: target });
    Reflect.defineMetadata(EVENT_SINKS_KEY, sinks, event);
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
