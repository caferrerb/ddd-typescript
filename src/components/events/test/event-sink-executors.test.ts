// Tests
import { DomainEvent } from '../events';
import { CommandHandlerFactory } from '../../commands/command-handler-factory';
import { EventSinkHandler, EventSinkExecutor } from '../avent-sink-executor';
import { EventSink, getEventSinksFor } from '../event-sink-annotation';
import { Event } from '../event-annotation';

describe('EventSinkExecutor', () => {
  
  @Event()
  class TestEvent implements DomainEvent {
    type = 'TestEvent';
    data: any;
    constructor(data?: any) {
      this.data = data ?? { test: 'data' };
    }
  }

  @Event()
  class FailingEvent implements DomainEvent {
    type = 'FailingEvent';
    data = { test: 'data' };
  }

  @EventSink({ event: TestEvent, condition: (event: TestEvent) => event.data.test === 'data' })
  class TestSink implements EventSinkHandler {
    handle = jest.fn().mockResolvedValue(undefined);
  }

  @EventSink({ event: FailingEvent })
  class FailingSink implements EventSinkHandler {
    handle = jest.fn().mockRejectedValue(new Error('Sink failed'));
  }

  @EventSink({ event: TestEvent })
  class FailingSink2 implements EventSinkHandler {
    handle = jest.fn().mockRejectedValue(new Error('Sink failed'));
  }

  let factory: CommandHandlerFactory;
  let testEvent: TestEvent;
  let testSink: TestSink;
  let failingSink: FailingSink;
  let failingSink2: FailingSink2;
  let trace: jest.Mock;

  beforeEach(() => {
    testEvent = new TestEvent();
    testSink = new TestSink();
    failingSink = new FailingSink();
    failingSink2 = new FailingSink2();
    trace = jest.fn();

    factory = {
      create<T>(type: new (...args: any[]) => T): T {
        if (type === TestSink) return testSink as T;
        if (type === FailingSink) return failingSink as T;
        if (type === FailingSink2) return failingSink2 as T;
        return null as T;
      },
      getStateStore: jest.fn(),
      getEventStore: jest.fn()
    };
  });

  it('should execute all event sinks for an event', async () => {
    const executor = new EventSinkExecutor(factory);
    await executor.run(testEvent);
    
    expect(testSink.handle).toHaveBeenCalledWith(testEvent);
  });

  it('should skip sinks when condition returns false', async () => {
    const executor = new EventSinkExecutor(factory);

    await executor.run(new TestEvent({ test: 'other data' }));
    
    expect(testSink.handle).not.toHaveBeenCalled();
  });

  it('should execute sinks when condition returns true', async () => {
    const executor = new EventSinkExecutor(factory);

    await executor.run(testEvent);
    
    expect(testSink.handle).toHaveBeenCalledWith(testEvent);
  });

  it('should call trace function when provided', async () => {
    const executor = new EventSinkExecutor(factory, { trace });
  
    await executor.run(testEvent);
    
    expect(trace).toHaveBeenCalledWith({
      type: 'event.sink.invoked',
      data: { sink: 'TestSink', event: testEvent }
    });
  });

  it('should continue execution when a sink fails and failFast is false', async () => {
    const executor = new EventSinkExecutor(factory, { trace, failFast: false });
  
    await executor.run(new TestEvent());
    
    expect(failingSink2.handle).toHaveBeenCalled();
    expect(testSink.handle).toHaveBeenCalled();
  });

  it('should throw error when a sink fails and failFast is true', async () => {
    const executor = new EventSinkExecutor(factory, { trace, failFast: true });
  
    await expect(executor.run(new FailingEvent())).rejects.toThrow('Sink failed');
    
    expect(failingSink.handle).toHaveBeenCalled();
    expect(trace).toHaveBeenCalledWith({
      type: 'event.sink.failed',
      data: { sink: 'FailingSink', error: expect.any(Error) }
    });
  });
});