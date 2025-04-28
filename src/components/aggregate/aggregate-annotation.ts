import 'reflect-metadata';
import { METADATA_KEYS } from '../reflection';

export function aggregateRoot(name?: string): ClassDecorator {
    return (target) => {
        const className =name ?? target.name;
        Reflect.defineMetadata(METADATA_KEYS.AGGREGATE_ROOT, true, target);
        Reflect.defineMetadata(METADATA_KEYS.AGGREGATE_NAME, name ?? target.name, Reflect);

        const existing = Reflect.getMetadata(METADATA_KEYS.REGISTERED_AGGREGATES, Reflect) || {};
        Reflect.defineMetadata(METADATA_KEYS.REGISTERED_AGGREGATES, {...existing, [className]: target}, Reflect);
    };
}

export function isAggregateRoot(target: Function): boolean {
    return Reflect.getMetadata(METADATA_KEYS.AGGREGATE_ROOT, target) === true;
}

export function getAggregateByName(name: string): Function | undefined {
    const ars = Reflect.getMetadata(METADATA_KEYS.REGISTERED_AGGREGATES, Reflect);
    if (!ars[name]) throw new Error('Aggregate not found')
    return ars[name];
}

export function getAggregateName(target: Function): string | undefined {
    return Reflect.getMetadata(METADATA_KEYS.AGGREGATE_NAME, target);
}

export function getAllRegisteredAggregates(): Function[] {
    return Reflect.getMetadata(METADATA_KEYS.REGISTERED_AGGREGATES, Reflect) || [];
}