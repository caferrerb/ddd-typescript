import { CommandDispatcher, CommandMiddleware } from '../command-dispatcher';
import { GenericCommandHandler } from '../baseCommandHandler';
import { CommandHandlerFactory } from '../command-handler-factory';
import { InMemoryEventStore, InMemoryStateStore } from '../../../test/infraestructure';
import { EventSinkExecutor } from '../../events/avent-sink-executor';
import {DepositCommand, DepositCommandHandler, WithdrawCommand} from "./mocks/commandmocks";
import {TestAggregate} from "../../aggregate/test/mocks/aggregatemocks";
import {DepositEvent} from "../../events/test/mocks/eventsmocks";

describe('CommandDispatcher', () => {
  let dispatcher: CommandDispatcher;
  let factory: CommandHandlerFactory;
  let eventStore: InMemoryEventStore;
  let stateStore: InMemoryStateStore;
  let genericHandler: GenericCommandHandler<any>;

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    stateStore = new InMemoryStateStore();
    
    factory = {
      create: ((type: any): any => {
        if (type === TestAggregate) return new TestAggregate();
        if (type === DepositCommandHandler) return new DepositCommandHandler();
        throw new Error('Unknown type');
      }),
      getEventStore: jest.fn(() => eventStore),
      getStateStore: jest.fn(() => stateStore),
    };

    dispatcher = new CommandDispatcher(factory);
  });

  it('should dispatch a command and return the result', async () => {
    const command = new DepositCommand({ amount: 100 }, { aggregateId: 'agg-1' });
    
    const result = await dispatcher.dispatch(command);
    
    expect(result.aggregate).toBeDefined();
    expect(result.events).toHaveLength(1);
    expect(result.events[0].data.amount).toBe(100);
    expect(result.aggregate.getState().value).toBe(100);
  });

  it('should handle commands with aggregate command handlers', async () => {
    await stateStore.save(TestAggregate, 'agg-2', { value: 50 });
    
    const command = new WithdrawCommand({ amount: 20 }, { aggregateId: 'agg-2' });
    
    const result = await dispatcher.dispatch(command);
    
    expect(result.aggregate.getState().value).toBe(30);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].data.amount).toBe(20);
  });

  it('should handle multiple commands in sequence', async () => {
    const depositCommand = new DepositCommand({ amount: 100 }, { aggregateId: 'agg-3' });
    const withdrawCommand = new WithdrawCommand({ amount: 30 }, { aggregateId: 'agg-3' });
    
    await dispatcher.dispatch(depositCommand);
    const result = await dispatcher.dispatch(withdrawCommand);
    
    expect(result.aggregate.getState().value).toBe(70);
  });

  it('should throw an error when command handling fails', async () => {
    const invalidCommand = new WithdrawCommand({ amount: 200 }, { aggregateId: 'agg-4' });
    
    // First deposit a smaller amount
    await dispatcher.dispatch(new DepositCommand({ amount: 50 }, { aggregateId: 'agg-4' }));
    
    // Then try to withdraw more than available
    await expect(dispatcher.dispatch(invalidCommand)).rejects.toThrow();
  });

  it('should execute event sinks after command handling', async () => {
    // Create a mock event sink
    const mockSink = jest.fn();
    const sinks = new EventSinkExecutor(factory);
    //sinks.register(DepositEvent, mockSink);
    
    const dispatcherWithSinks = new CommandDispatcher(factory, [], sinks);
    
    const command = new DepositCommand({ amount: 100 }, { aggregateId: 'agg-5' });
    await dispatcherWithSinks.dispatch(command);
    
    // Verify the sink was called with the event
    expect(mockSink).toHaveBeenCalledTimes(1);
    expect(mockSink.mock.calls[0][0]).toBeInstanceOf(DepositEvent);
    expect(mockSink.mock.calls[0][0].data.amount).toBe(100);
  });
  
  it('should apply middleware in the correct order', async () => {
    const executionOrder: string[] = [];
    
    const middleware1: CommandMiddleware = async (command, next) => {
      executionOrder.push('middleware1-before');
      const result = await next(command);
      executionOrder.push('middleware1-after');
      return result;
    };
    
    const middleware2: CommandMiddleware = async (command, next) => {
      executionOrder.push('middleware2-before');
      const result = await next(command);
      executionOrder.push('middleware2-after');
      return result;
    };
    
    const dispatcherWithMiddleware = new CommandDispatcher(factory, [middleware1, middleware2]);
    
    const command = new DepositCommand({ amount: 100 }, { aggregateId: 'agg-6' });
    await dispatcherWithMiddleware.dispatch(command);
    
    expect(executionOrder).toEqual([
      'middleware1-before',
      'middleware2-before',
      'middleware2-after',
      'middleware1-after'
    ]);
  });
});
