import { CommandDispatcher, CommandDispatcherBuilder, CommandMiddleware } from '../command-dispatcher';
import { GenericCommandHandler } from '../baseCommandHandler';
import { CommandHandlerFactory } from '../command-handler-factory';
import { InMemoryEventStore, InMemoryStateStore } from '../../../test/infraestructure';
import { EventSinkExecutor } from '../../events/avent-sink-executor';
import {DepositCommand, DepositCommandHandler, WithdrawCommand} from "./mocks/commandmocks";
import {TestAggregate} from "../../aggregate/test/mocks/aggregatemocks";
import {DepositEvent, DepositEventSink, WithdrawEvent, WithDrawSink} from "../../events/test/mocks/eventsmocks";

describe('CommandDispatcher', () => {
  let dispatcher: CommandDispatcher;
  let factory: CommandHandlerFactory;
  let eventStore: InMemoryEventStore;
  let stateStore: InMemoryStateStore;
  let genericHandler: GenericCommandHandler<any>;
  let middleware1: CommandMiddleware;
  let middleware2: CommandMiddleware;
  let withDrawSink: any;
  let depositEventSink: any;

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    stateStore = new InMemoryStateStore();
    middleware1 = jest.fn();
    middleware2 = jest.fn();
    withDrawSink = jest.fn(async (e: WithdrawEvent)=>{ return } );
    depositEventSink = jest.fn(async (e: DepositEvent)=>{ return } );
    
    factory = {
      create: ((type: any): any => {
        if (type === DepositCommandHandler) return new DepositCommandHandler();
        if (type === DepositEventSink) return new DepositEventSink(depositEventSink);
        if (type === WithDrawSink) return new WithDrawSink(withDrawSink);

        return null;
      }),
      getEventStore: jest.fn(() => eventStore),
      getStateStore: jest.fn(() => stateStore),
    };

    dispatcher = new CommandDispatcherBuilder(factory)
    .withMiddlewares([
        async (command, next) => {
          await middleware1(command, next);
          return await next(command);
        },
        async (command, next) => {
          await middleware2(command, next);
          return await next(command);
        },
    ])
    .withEventSinks(new EventSinkExecutor(factory))
    .build();
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

  it('should execute event sinks after command handling', async () => {
    const mockSink = depositEventSink;
    const sinks = new EventSinkExecutor(factory);

    const dispatcherWithSinks = new CommandDispatcher(factory, [], sinks);
    
    const command = new DepositCommand({ amount: 100 }, { aggregateId: 'agg-5' });
    await dispatcherWithSinks.dispatch(command);
    
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
