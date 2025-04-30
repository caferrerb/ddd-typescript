import {WithdrawCommand} from "../../../commands/test/mocks/commandmocks";
import {reducer} from "../../../events/event-reducer";
import {DepositEvent, WithdrawEvent} from "@/components/events/test/mocks/eventsmocks";
import {AggregateRoot} from "../../aggregate";
import {aggregateRoot} from "../../aggregate-annotation";
import {aggregateCommandHandler} from "../../aggregate-command";

export interface TestAggregateState {
    value: number;
}
@aggregateRoot()
export class TestAggregate extends AggregateRoot<TestAggregateState> {
    constructor(id?: string) {
        super(id);
        this.state = { value: 0 };
    }

    @reducer(DepositEvent)
    public applyDeposit(event: DepositEvent): void {
        this.state.value += event.data.amount;
    }

    deposit(amount: number): DepositEvent {
        return new DepositEvent({ amount });
    }

    @reducer(WithdrawEvent)
    public applyWithdraw(event: WithdrawEvent): void {
        this.state.value -= event.data.amount;
    }

    @aggregateCommandHandler()
    withdraw(command: WithdrawCommand): WithdrawEvent {
        const event = new WithdrawEvent({ amount: command.data.amount });
        this.apply(event);
        return event;
    }

    serialize(): Record<string, any> {
        return {
            ...this.state,
        };
    }

    deSerialize(json: Record<string, any>): TestAggregateState {
        return {
            value: json.value,
        }
    }
}