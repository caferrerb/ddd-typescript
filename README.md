# Domain-Driven Design (DDD) TypeScript Framework

A lightweight, flexible TypeScript framework for implementing Domain-Driven Design patterns in your applications.

## Core Components

### Aggregates

- **AggregateRoot**: Base class for domain aggregates that encapsulates business logic and maintains consistency boundaries
- **@aggregateRoot()**: Decorator to mark a class as an aggregate root
- **@aggregateCommandHandler()**: Decorator to mark methods that handle commands directly on aggregates

### Commands

- **Command**: Interface for command objects that represent intentions to change system state
- **@command()**: Decorator to define commands with metadata about their target aggregate
- **CommandHandler**: Interface for classes that process commands
- **@commandHandlerFor()**: Decorator to associate command handlers with specific commands
- **CommandDispatcher**: Orchestrates command execution with middleware support

### Events

- **DomainEvent**: Base class for domain events that represent state changes
- **@domainEvent()**: Decorator to mark classes as domain events
- **@reducer()**: Decorator to mark methods that apply events to aggregates
- **EventSinkExecutor**: Manages the execution of event sinks after events are applied

### Event Sinks

- **@EventSink()**: Decorator to register handlers for specific events
- **EventSinkHandler**: Interface for classes that respond to domain events

## Key Features

- **Event Sourcing**: Rebuild aggregate state from a sequence of events
- **Command Handling**: Process commands through dedicated handlers or directly on aggregates
- **Middleware Support**: Extend command processing with custom middleware
- **Event Sinks**: React to domain events with decoupled handlers
- **Explicit Reducers**: Define how events modify aggregate state

## Usage Example

Here's a complete example of how to use the framework to implement a simple bank account system:

```typescript
// Domain Events
@domainEvent()
class AccountCreated extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly owner: string,
    public readonly initialBalance: number
  ) {
    super();
  }
}

@domainEvent()
class MoneyDeposited extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly amount: number
  ) {
    super();
  }
}

@domainEvent()
class MoneyWithdrawn extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly amount: number
  ) {
    super();
  }
}

// Commands
@command()
class CreateAccount {
  constructor(
    public readonly owner: string,
    public readonly initialBalance: number
  ) {}
}

@command()
class DepositMoney {
  constructor(
    public readonly accountId: string,
    public readonly amount: number
  ) {}
}

@command()
class WithdrawMoney {
  constructor(
    public readonly accountId: string,
    public readonly amount: number
  ) {}
}

// Aggregate
interface AccountState {
  id: string;
  owner: string;
  balance: number;
}

@aggregateRoot()
class BankAccount extends AggregateRoot<AccountState> {
  constructor(id?: string) {
    super(id);
    this.state = {
      id: this._id,
      owner: '',
      balance: 0
    };
  }

  @aggregateCommandHandler()
  createAccount(command: CreateAccount): void {
    if (this.state.owner) {
      throw new Error('Account already exists');
    }

    this.apply(new AccountCreated(
      this._id,
      command.owner,
      command.initialBalance
    ));
  }

  @aggregateCommandHandler()
  depositMoney(command: DepositMoney): void {
    if (command.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    this.apply(new MoneyDeposited(
      this._id,
      command.amount
    ));
  }

  @aggregateCommandHandler()
  withdrawMoney(command: WithdrawMoney): void {
    if (command.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (this.state.balance < command.amount) {
      throw new Error('Insufficient funds');
    }

    this.apply(new MoneyWithdrawn(
      this._id,
      command.amount
    ));
  }

  // Event Reducers
  @reducer()
  onAccountCreated(event: AccountCreated): void {
    this.state.owner = event.owner;
    this.state.balance = event.initialBalance;
  }

  @reducer()
  onMoneyDeposited(event: MoneyDeposited): void {
    this.state.balance += event.amount;
  }

  @reducer()
  onMoneyWithdrawn(event: MoneyWithdrawn): void {
    this.state.balance -= event.amount;
  }
}

// Event Sink Example
@EventSink()
class AccountEventLogger implements EventSinkHandler {
  @EventSinkHandler()
  handleAccountCreated(event: AccountCreated): void {
    console.log(`Account created: ${event.accountId} for ${event.owner}`);
  }

  @EventSinkHandler()
  handleMoneyDeposited(event: MoneyDeposited): void {
    console.log(`Deposited ${event.amount} to account ${event.accountId}`);
  }

  @EventSinkHandler()
  handleMoneyWithdrawn(event: MoneyWithdrawn): void {
    console.log(`Withdrawn ${event.amount} from account ${event.accountId}`);
  }
}

// Usage Example
async function main() {
  const commandDispatcher = new CommandDispatcher();
  const eventSinkExecutor = new EventSinkExecutor();

  // Create a new account
  const createAccountCommand = new CreateAccount('John Doe', 1000);
  const account = await commandDispatcher.dispatch(createAccountCommand);

  // Deposit money
  const depositCommand = new DepositMoney(account._id, 500);
  await commandDispatcher.dispatch(depositCommand);

  // Withdraw money
  const withdrawCommand = new WithdrawMoney(account._id, 200);
  await commandDispatcher.dispatch(withdrawCommand);

  // Get final balance
  console.log(`Final balance: ${account.getState().balance}`);
}
```

This example demonstrates:
- Defining domain events with the `@domainEvent()` decorator
- Creating commands with the `@command()` decorator
- Implementing an aggregate root with command handlers and event reducers
- Using event sinks to react to domain events
- Dispatching commands and handling events in the application

The framework provides a clean and type-safe way to implement DDD patterns while maintaining separation of concerns and domain integrity.




