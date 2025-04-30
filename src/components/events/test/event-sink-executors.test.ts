import { EventSinkExecutor } from '../avent-sink-executor';
import { CommandHandlerFactory } from '../../commands/command-handler-factory';
import {
  DepositEvent,
  DepositEventSink,
  OtherDepositEventSink,
  TestEvent,
  WithdrawEvent,
  WithDrawSink
} from './mocks/eventsmocks';
import {TestAggregate} from "../../aggregate/test/mocks/aggregatemocks";

describe('EventSinkExecutor', () => {
  let factory: CommandHandlerFactory;
  let executor: EventSinkExecutor;
  let mockAggregate: TestAggregate;
  let depositSink: DepositEventSink;
  let withdrawSink: WithDrawSink;
  let otherSink: DepositEventSink;

  beforeEach(() => {
    depositSink = new DepositEventSink(jest.fn(async (e: DepositEvent)=>{ return } ));
    withdrawSink = new WithDrawSink(jest.fn(async (e: WithdrawEvent)=>{ return } ));
    otherSink = new OtherDepositEventSink(jest.fn(async (e: WithdrawEvent)=>{ return } ));

    factory = {
      create: jest.fn((type: any): any => {
        if (type === DepositEventSink) return depositSink;
        if (type === WithDrawSink) return withdrawSink;
        if (type === OtherDepositEventSink) return withdrawSink;
        throw new Error(`Unknown sink type: ${type.name}`);
      }),
      getEventStore: jest.fn(),
      getStateStore: jest.fn(),
    };

    executor = new EventSinkExecutor(factory);
    mockAggregate = new TestAggregate('ar-1');
    mockAggregate.deSerialize({value: 0});
  });

  it('should execute the appropriate sink for an event', async () => {
    const event = new DepositEvent({ amount: 100 });
    
    await executor.run(event, mockAggregate);
    
    expect(factory.create).toHaveBeenCalledWith(DepositEventSink);
    expect(depositSink.fn).toHaveBeenCalledWith(event, mockAggregate);
  });

  it('should not execute sinks for events without registered sinks', async () => {
    const event = new TestEvent();
    
    await executor.run(event, mockAggregate);
    
    expect(factory.create).not.toHaveBeenCalled();
  });

  it('should respect the couldBeTriggered condition when true', async () => {
    const event = new WithdrawEvent({ amount: 50 });
    
    await executor.run(event, mockAggregate);
    
    expect(factory.create).toHaveBeenCalledWith(WithDrawSink);
    expect(withdrawSink.fn).toHaveBeenCalled();
  });

  it('should respect the couldBeTriggered condition when false', async () => {
    const event = new WithdrawEvent({ amount: 0 });
    
    await executor.run(event, mockAggregate);
    
    expect(factory.create).toHaveBeenCalledWith(WithDrawSink);
    expect(withdrawSink.fn).not.toHaveBeenCalled();
  });

  it('should handle errors in sinks when failFast is false', async () => {
    const failingSink = new DepositEventSink(jest.fn().mockRejectedValue(new Error('Sink failed')));
    factory.create = jest.fn().mockReturnValue(failingSink);
    
    const event = new DepositEvent({ amount: 100 });
    
    await expect(executor.run(event, mockAggregate)).resolves.not.toThrow();
  });

  it('should throw errors when failFast is true', async () => {
    const failingSink = new DepositEventSink(jest.fn().mockRejectedValue(new Error('Sink failed')));
    factory.create = jest.fn().mockReturnValue(failingSink);
    
    executor = new EventSinkExecutor(factory, { failFast: true });
    const event = new DepositEvent({ amount: 100 });
    
    await expect(executor.run(event, mockAggregate)).rejects.toThrow('Sink failed');
  });

  it('should call trace function when provided', async () => {
    const traceFn = jest.fn();
    executor = new EventSinkExecutor(factory, { trace: traceFn });
    
    const event = new DepositEvent({ amount: 100 });
    
    await executor.run(event, mockAggregate);
    
    expect(traceFn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'event.sink.invoked',
        data: expect.objectContaining({
          sink: 'DepositEventSink',
          event
        })
      })
    );
  });

  it('should execute multiple sinks for the same event if registered', async () => {
    const anotherSink = new OtherDepositEventSink(jest.fn().mockResolvedValue(undefined));
    const sinks = [depositSink, anotherSink];
    let sinkIndex = 0;
    
    factory.create = jest.fn((): any => sinks[sinkIndex++]);

    const event = new DepositEvent({ amount: 100 });
    
    await executor.run(event, mockAggregate);
    
    expect(factory.create).toHaveBeenCalledTimes(2);
    expect(sinks[0].fn).toHaveBeenCalledWith(event, mockAggregate);
    expect(sinks[1].fn).toHaveBeenCalledWith(event, mockAggregate);
    
    // Restore the original implementation
    jest.restoreAllMocks();
  });
});
