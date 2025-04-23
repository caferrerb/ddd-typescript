import { getConventionReducers, getExplicitReducersAll } from '../events/event-reducer';
import { StateStore } from '../../infraestructure/statestore';
import { EventStore } from '../../infraestructure/eventstore';
import { CommandHandler, CommandHandlerFactory } from './command-handler-factory';
import { Command } from './command';
import { getAggregateTypeForCommand } from './command-annotation';
import { DomainEvent } from '../events/events';
import { getHandlerForCommand } from './command-handler-annotation';
import { AggregateRoot } from '../aggregate/aggregate';
import { getAggregateCommandHandlers } from '../aggregate/aggregate-command';

export interface CommandHandlerResult<TAggregate extends AggregateRoot> {
  state: TAggregate;
  events: DomainEvent[];
}

export interface GenericCommandHandlerInterface {
    handle<TAggregate extends AggregateRoot>(command: Command): Promise<CommandHandlerResult<TAggregate>>;
  }

export class GenericCommandHandler<TAggregate extends AggregateRoot> implements GenericCommandHandlerInterface {
    constructor(private readonly factory: CommandHandlerFactory) {}
  
    async handle<TAggregate extends AggregateRoot>(command: Command): Promise<CommandHandlerResult<TAggregate>> {
      const aggregateType: any = getAggregateTypeForCommand(command);
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

    if (handlerType) {
      const handler = this.factory.create(handlerType as new (...args: any[]) => CommandHandler<Command, TAggregate>) as CommandHandler<Command, TAggregate>;
      await handler.execute(aggregate, command);
    } else {
      const handlers = getAggregateCommandHandlers(aggregateType);
      const handlerMeta = handlers.find(h => command.constructor === h.commandType);
      if (!handlerMeta) {
        throw new Error(`No se encontró handler para ${command.type}`);
      }
      const handlerFn = (aggregate as any)[handlerMeta.methodName].bind(aggregate);
      await handlerFn(command);
    }

   
      const events = aggregate.pendingEvents;
      for (const event of events) {
        aggregate['apply'](event);
      }

      await stateStore.save(aggregateType, aggregateId, aggregate.toJSON());
      await eventStore.appendEvents(aggregateType, aggregateId, events);
  
      aggregate.clearEvents();
      return { state: aggregate, events };
    }
  }
  