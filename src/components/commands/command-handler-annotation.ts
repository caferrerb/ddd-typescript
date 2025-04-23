import 'reflect-metadata';

export const COMMAND_HANDLER_KEY = Symbol('ddd:commandHandler');
export const ALL_COMMAND_HANDLERS_KEY = Symbol('ddd:allCommandHandlers');

export function CommandHandlerFor(commandType: Function): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(COMMAND_HANDLER_KEY, commandType, target);

    const existing: Function[] = Reflect.getMetadata(ALL_COMMAND_HANDLERS_KEY, Reflect) || [];
    if (!existing.includes(target)) {
      Reflect.defineMetadata(ALL_COMMAND_HANDLERS_KEY, [...existing, target], Reflect);
    }
  };
}

export function getCommandTypeForHandler(handlerClass: Function): Function | undefined {
  return Reflect.getMetadata(COMMAND_HANDLER_KEY, handlerClass);
}

export function getHandlerForCommand(command: any): Function | undefined {
  const all = getAllCommandHandlers();
  return all.find(handlerClass => {
    const commandType:any = getCommandTypeForHandler(handlerClass);
    return command instanceof commandType;
  });
}

export function getAllCommandHandlers(): Function[] {
  return Reflect.getMetadata(ALL_COMMAND_HANDLERS_KEY, Reflect) || [];
}
