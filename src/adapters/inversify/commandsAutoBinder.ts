import { getAllEventSinks } from '../../components/events/event-sink-annotation';
import { getAllCommandHandlers } from '../../components/commands/command-handler-annotation';
import { Container } from 'inversify';

export function bindAllDDDComponents(container: Container) {
  const handlers = getAllCommandHandlers();
  for (const handler of handlers) {
    container.bind(handler).toSelf();
  }
  const sinks = getAllEventSinks();
  for (const sink of sinks) {
    container.bind(sink.sinkType).toSelf();
  }
}