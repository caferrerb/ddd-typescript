import 'reflect-metadata';
import { Container } from 'inversify';
import { ExampleService } from './services/example.service';

const container = new Container();

// Register services
container.bind<ExampleService>(ExampleService).toSelf();

export { container }; 