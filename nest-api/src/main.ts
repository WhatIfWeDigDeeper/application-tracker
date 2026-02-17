import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';
import dotenv from 'dotenv';

dotenv.config();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(
    (await import('@fastify/multipart')).default,
    { limits: { fileSize: 1_048_576 } },
  );

  app.enableCors({
    origin: ['http://localhost:3050'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.API_PORT || 5050;
  await app.listen({ port: Number(port), host: '0.0.0.0' });
  console.log(`NestJS API running on port ${port}`);
}

bootstrap();
