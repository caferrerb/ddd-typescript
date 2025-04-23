import { getAllCommandHandlers } from '../../components/commands/command-handler-annotation';
import { Container } from 'inversify';

export function bindAllCommandHandlers(container: Container) {
  const handlers = getAllCommandHandlers();
  for (const handler of handlers) {
    container.bind(handler).toSelf();
  }
}