import { CommandDispatcher, DispatchResult } from '../command-dispatcher';
import { CommandHandlerFactory } from '../command-handler-factory';
import { Command } from '../command';
import { AggregateRoot } from '../../aggregate/aggregate';
import { DomainEvent } from '../../events/events';
import { EventSinkExecutor } from '../../events/avent-sink-executor';
import { GenericCommandHandler, CommandHandlerResult } from '../baseCommandHandler';

describe('CommandDispatcher', () => {
  @AggregateRoot()
  class TestAggregate implements AggregateRoot {
    id = '123';
    version = 1;
  }

  class TestCommand implements Command {
    type = 'TestCommand';
    aggregateId = '123';
  }

  class TestEvent implements DomainEvent {
    type = 'TestEvent';
    data = { test: 'data' };
  }

  let factory: CommandHandlerFactory;
  let mockHandler: jest.Mocked<GenericCommandHandler>;
  let mockSinks: jest.Mocked<EventSinkExecutor>;
  let dispatcher: CommandDispatcher;
  let testCommand: TestCommand;
  let testAggregate: TestAggregate;
  let testEvent: TestEvent;
  let trace: jest.Mock;

  beforeEach(() => {
    testCommand = new TestCommand();
    testAggregate = new TestAggregate();
    testEvent = new TestEvent();
    trace = jest.fn();

    mockHandler = {
      handle: jest.fn()
    } as unknown as jest.Mocked<GenericCommandHandler>;

    mockSinks = {
      run: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventSinkExecutor>;

    factory = {
      create: jest.fn(),
      getStateStore: jest.fn(),
      getEventStore: jest.fn()
    };

    mockHandler.handle.mockResolvedValue({
      state: testAggregate,
      events: [testEvent]
    } as CommandHandlerResult<TestAggregate>);

    dispatcher = new CommandDispatcher(
      factory,
      [],
      mockSinks,
      mockHandler
    );
  });

  it('should dispatch a command and return the result', async () => {
    const result = await dispatcher.dispatch<TestAggregate>(testCommand);

    expect(mockHandler.handle).toHaveBeenCalledWith(testCommand);
    expect(result).toEqual({
      aggregate: testAggregate,
      events: [testEvent]
    });
  });

  it('should execute event sinks for each event', async () => {
    await dispatcher.dispatch<TestAggregate>(testCommand);

    expect(mockSinks.run).toHaveBeenCalledWith(testEvent);
  });

  it('should call trace function when provided', async () => {
    await dispatcher.dispatch<TestAggregate>(testCommand, { trace });

    expect(trace).toHaveBeenCalledWith({
      type: 'event.applied',
      data: { event: testEvent }
    });
  });

  it('should apply middlewares in the correct order', async () => {
    const executionOrder: string[] = [];
    
    const middleware1 = jest.fn().mockImplementation(async (cmd, next) => {
      executionOrder.push('middleware1-before');
      const result = await next(cmd);
      executionOrder.push('middleware1-after');
      return result;
    });
    
    const middleware2 = jest.fn().mockImplementation(async (cmd, next) => {
      executionOrder.push('middleware2-before');
      const result = await next(cmd);
      executionOrder.push('middleware2-after');
      return result;
    });

    dispatcher = new CommandDispatcher(
      factory,
      [middleware1, middleware2],
      mockSinks,
      mockHandler
    );

    await dispatcher.dispatch<TestAggregate>(testCommand);

    expect(executionOrder).toEqual([
      'middleware1-before',
      'middleware2-before',
      'middleware2-after',
      'middleware1-after'
    ]);
  });

  it('should allow middlewares to modify the command', async () => {
    const modifiedCommand = { ...testCommand, modified: true };
    
    const middleware = jest.fn().mockImplementation(async (cmd, next) => {
      return next(modifiedCommand);
    });

    dispatcher = new CommandDispatcher(
      factory,
      [middleware],
      mockSinks,
      mockHandler
    );

    await dispatcher.dispatch<TestAggregate>(testCommand);

    expect(mockHandler.handle).toHaveBeenCalledWith(modifiedCommand);
  });

  it('should allow middlewares to short-circuit the chain', async () => {
    const expectedResult: DispatchResult<TestAggregate> = {
      aggregate: testAggregate,
      events: []
    };
    
    const middleware = jest.fn().mockResolvedValue(expectedResult);

    dispatcher = new CommandDispatcher(
      factory,
      [middleware],
      mockSinks,
      mockHandler
    );

    const result = await dispatcher.dispatch<TestAggregate>(testCommand);

    expect(mockHandler.handle).not.toHaveBeenCalled();
    expect(result).toBe(expectedResult);
  });
});

