import {DomainEvent} from "@/components/events/events";
import {command} from "@/components/commands/command-annotation";
import {Command} from "@/components/commands/command";
import {commandHandlerFor} from "@/components/commands/command-handler-annotation";
import {CommandHandler} from "@/components/commands/command-handler-factory";
import {TestAggregate} from "@/components/aggregate/test/mocks/aggregatemocks";

@command({ aggregate: 'TestAggregate' })
export class DepositCommand implements Command<{ amount: number }> {
    constructor(public readonly data: { amount: number }, public readonly metadata?: any) {}
    readonly type = 'DepositCommand';
}

@command({ aggregate: 'TestAggregate', methodName: 'withdraw' })
export class WithdrawCommand implements Command<{ amount: number }> {
    constructor(public readonly data: { amount: number }, public readonly metadata?: any) {}
    readonly type = 'WithdrawCommand';
}

@commandHandlerFor(DepositCommand)
export class DepositCommandHandler implements CommandHandler<DepositCommand, TestAggregate> {
    async execute(aggregate: TestAggregate, command: DepositCommand): Promise<DomainEvent> {
        return aggregate.deposit(command.data.amount);
    }
}
