import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    enableDebugMessages: true,
  }));
  console.log('process.env.PORT', process.env.PORT);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
