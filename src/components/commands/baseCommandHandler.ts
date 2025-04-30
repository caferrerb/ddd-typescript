import {CommandHandler, CommandHandlerFactory} from './command-handler-factory';
import {Command} from './command';
import {getAggregateNameForCommand, getMethodNameForCommand} from './command-annotation';
import {DomainEvent} from '../events/events';
import {getHandlerForCommand} from './command-handler-annotation';
import {AggregateRoot} from '../aggregate/aggregate';
import {getAggregateByName} from "@/components/aggregate/aggregate-annotation";

export interface CommandHandlerResult<TAggregate extends AggregateRoot> {
  aggregate: TAggregate;
  events: DomainEvent[];
}

export interface GenericCommandHandlerInterface {
    handle<TAggregate extends AggregateRoot>(command: Command): Promise<CommandHandlerResult<TAggregate>>;
  }

export class GenericCommandHandler<TAggregate extends AggregateRoot> implements GenericCommandHandlerInterface {
    constructor(private readonly factory: CommandHandlerFactory) {}
  
    async handle<TAggregate extends AggregateRoot>(command: Command): Promise<CommandHandlerResult<TAggregate>> {
      const aggregateType: any = getAggregateByName(getAggregateNameForCommand(command));
      if (!aggregateType) throw new Error(`No se pudo inferir el tipo de agregado para el comando ${command.type}`);
  
      const aggregateId = command.metadata?.aggregateId;
      if (!aggregateId) throw new Error(`El comando ${command.type} no contiene aggregateId en metadata`);
  
      const stateStore = this.factory.getStateStore();
      const eventStore = this.factory.getEventStore();
  
      let aggregate = new aggregateType(aggregateId);
  
      const snapshot = await stateStore.get<any>(aggregateType, aggregateId);
      if (snapshot) {
        aggregate.loadFrom(snapshot);
      } else {
        const pastEvents = await eventStore.getEvents(aggregateType, aggregateId);
        for (const event of pastEvents) {
          aggregate['apply'](event);
        }
        aggregate.clearEvents(); 
      }
  
      const handlerType = getHandlerForCommand(command);
      let eventsResult: DomainEvent[] | DomainEvent;
    if (handlerType) {
      const handler = this.factory.create(handlerType as new (...args: any[]) => CommandHandler<Command, TAggregate>) as CommandHandler<Command, TAggregate>;
      eventsResult = await handler.execute(aggregate, command);
    } else {
      const methodName = getMethodNameForCommand(command);
      if (!methodName) {
        throw new Error(`No se encontró handler para ${command.type}`);
      }
      const handlerFn = (aggregate as any)[methodName].bind(aggregate);
      eventsResult = await handlerFn(command);
    }

      const events = Array.isArray(eventsResult)? eventsResult : [eventsResult];

    for (const event of events) {
        aggregate['apply'](event);
    }

      await stateStore.save(aggregateType, aggregateId, aggregate.toJSON());
      await eventStore.appendEvents(aggregateType, aggregateId, events);
  
      aggregate.clearEvents();
      return { aggregate, events };
    }
  }
  