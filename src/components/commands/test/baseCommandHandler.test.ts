import {Command} from "../command";
import {CommandHandlerFactory} from "../command-handler-factory";
import {InMemoryEventStore, InMemoryStateStore} from "../../../test/infraestructure";
import {GenericCommandHandler} from "../baseCommandHandler";
import {DepositCommand, DepositCommandHandler, WithdrawCommand} from "./mocks/commandmocks";
import {DepositEvent} from "../../events/test/mocks/eventsmocks";
import {TestAggregate} from "../../aggregate/test/mocks/aggregatemocks";

describe('DefaultGenericCommandHandler', () => {
    let factory: CommandHandlerFactory;
    let handler: GenericCommandHandler<TestAggregate>;
    let eventStore: InMemoryEventStore;
    let stateStore: InMemoryStateStore;
    let commandHandler: DepositCommandHandler;
    beforeEach(() => {
      eventStore = new InMemoryEventStore();
      stateStore = new InMemoryStateStore();
      commandHandler = new DepositCommandHandler();
      
      factory = {
        create: ((type: any): any => {
          if (type === TestAggregate) return new TestAggregate();
          if (type === DepositCommandHandler) return commandHandler;
          throw new Error('Unknown type');
        }),
        getEventStore: jest.fn(() => eventStore),
        getStateStore: jest.fn(() => stateStore),
      };
  
      handler = new GenericCommandHandler<TestAggregate>(factory);
    });
  
    it('should handle a command and apply new events', async () => {
      const command = new DepositCommand({ amount: 100 }, { aggregateId: 'agg-1' });
  
      const { aggregate, events } = await handler.handle<TestAggregate>(command);
  
      expect(aggregate.getState().value).toBe(100);
      expect(events).toHaveLength(1);
      expect(events[0].data.amount).toBe(100);
    });
  
    it('should rehydrate aggregate from existing events', async () => {
      const previousEvent = new DepositEvent({ amount: 50 });
      await eventStore.appendEvents(TestAggregate, 'agg-2', [previousEvent]);
  
      const command = new DepositCommand({ amount: 30 }, { aggregateId: 'agg-2' });
      const { aggregate, events } = await handler.handle<TestAggregate>(command);
  
      expect(aggregate.getState().value).toBe(80);
      expect(events).toHaveLength(1);
      expect(events[0].data.amount).toBe(30);
    });
  
    it('should rehydrate aggregate from snapshot if available', async () => {
      await stateStore.save(TestAggregate, 'agg-3', { value: 70 });
  
      const command = new DepositCommand({ amount: 20 }, { aggregateId: 'agg-3' });
      const { aggregate, events } = await handler.handle<TestAggregate>(command);
  
      expect(aggregate.getState().value).toBe(90);
      expect(events).toHaveLength(1);
      expect(events[0].data.amount).toBe(20);
    });
  
    it('should throw if no command handler is found', async () => {
      class UnknownCommand implements Command<{ test: string }> {
        constructor(public readonly data: { test: string }, public readonly metadata?: any) {}
        readonly type = 'UnknownCommand';
      }
  
      const badCommand = new UnknownCommand({ test: 'fail' }, { aggregateId: 'agg-4' });
  
      await expect(handler.handle(badCommand)).rejects.toThrowError('Aggregate not found');
    });
    it('shoud execute aggregate command handler', async () => {
      await stateStore.save(TestAggregate, 'agg-3', { value: 70 });
      const command = new WithdrawCommand({ amount: 10 }, { aggregateId: 'agg-3' });
      const { aggregate, events } = await handler.handle<TestAggregate>(command);
      expect(aggregate.getState().value).toBe(60);
      expect(events).toHaveLength(1);
      expect(events[0].data.amount).toBe(10);
    });
  });

