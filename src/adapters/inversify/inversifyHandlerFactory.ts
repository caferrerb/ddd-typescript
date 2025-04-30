import {StateStore} from "../../infraestructure/statestore";
import {CommandHandlerFactory} from "../../components/commands/command-handler-factory";
import {Container} from "inversify";
import {EventStore} from "../../infraestructure/eventstore";

export interface Dependencies {
    stateStore: string;
    eventStore: string;
}

export class InversifyHandlerFactory implements CommandHandlerFactory {
    constructor(private readonly container: Container, private readonly dependencies: Dependencies) {}
  
    create<T>(type: new (...args: any[]) => T): T {
      return this.container.resolve(type);
    }

    getStateStore(): StateStore {
        return this.container.get(this.dependencies.stateStore);
    }

    getEventStore(): EventStore {
        return this.container.get(this.dependencies.eventStore);
    }
}