import {DomainEvent} from "../../events";
import {EventSink} from "../../event-sink-annotation";
import {EventSinkHandler} from "../../avent-sink-executor";
import {domainEvent} from "../../event-annotation";
import {AggregateRoot} from "@/components/aggregate/aggregate";
import {TestAggregate} from "@/components/aggregate/test/mocks/aggregatemocks";

@domainEvent()
export class DepositEvent extends DomainEvent<{ amount: number }> {
    constructor(public readonly data: { amount: number }) {
        super('DepositEvent', data);
    }
}

@domainEvent()
export class WithdrawEvent extends DomainEvent<{ amount: number }> {
    constructor(public readonly data: { amount: number }) {
        super('WithdrawEvent', data);
    }
}

@domainEvent()
export class TestEvent extends DomainEvent {
    constructor(data?: any) {
        super('TestEvent', data ?? { test: 'data' })
    }
}

@domainEvent()
export class FailingEvent extends DomainEvent {
    constructor(data?: any) {
        super('FailingEvent', data ?? { test: 'data' })
    }
}

@EventSink(DepositEvent)
export class DepositEventSink implements EventSinkHandler<DepositEvent, TestAggregate> {
    constructor(public readonly fn:  (e: DepositEvent, ar: TestAggregate)=>Promise<any>  = jest.fn().mockResolvedValue(undefined)) {
    }
    public handle(e: DepositEvent, ar: TestAggregate) {
        return this.fn(e, ar)
    };
}


@EventSink(DepositEvent)
export class OtherDepositEventSink implements EventSinkHandler<DepositEvent, TestAggregate> {
    constructor(public readonly fn:  (e: DepositEvent, ar: TestAggregate)=>Promise<any>  = jest.fn().mockResolvedValue(undefined)) {
    }
    public handle(e: DepositEvent, ar: TestAggregate) {
        return this.fn(e, ar)
    };
}

@EventSink(WithdrawEvent)
export class WithDrawSink implements EventSinkHandler<WithdrawEvent, TestAggregate> {
    constructor(public readonly fn:  (e: WithdrawEvent,ar: TestAggregate)=>Promise<any>  = jest.fn().mockResolvedValue(undefined)) {
    }
    public handle(e: DepositEvent, ar: TestAggregate) {
        return this.fn(e,ar)
    };

    public couldBeTriggered(event: WithdrawEvent, aggregate: AggregateRoot): Promise<boolean> | boolean {
        return event.data.amount > 0;
    }
}

