import 'reflect-metadata';

const COMMAND_HANDLER_REGISTRY = new Map<Function, Function>();

export function CommandHandlerFor(commandType: Function): ClassDecorator {
  return (target: Function) => {
    COMMAND_HANDLER_REGISTRY.set(commandType, target);
  };
}

export function getHandlerForCommand(command: any): Function | undefined {
  return COMMAND_HANDLER_REGISTRY.get(command.constructor);
}

export function getAllCommandHandlers(): Function[] {
    return Array.from(COMMAND_HANDLER_REGISTRY.values());
  }