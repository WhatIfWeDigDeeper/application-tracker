import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const port = process.env.HISTORY_GRPC_PORT ?? '50051';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'history.v1',
      protoPath: join(process.cwd(), '..', 'proto', 'history', 'v1', 'history.proto'),
      url: `0.0.0.0:${port}`,
    },
  });

  await app.listen();
  console.log(`nest-history-api gRPC listening on port ${port}`);
}

bootstrap();
