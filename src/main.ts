import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule
} from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from 'src/app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const port = process.env.PORT || 7777;
  const app = await NestFactory.create(AppModule);

  // Setup CORS
  app.enableCors({
    origin: ['http://192.168.18.58:5173', 'http://localhost:5173', 'https://artha.sarojkasti.com.np', 'http://localhost:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Artha API')
    .setDescription('The Artha API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true
    },
    customSiteTitle: 'Artha API'
  };
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    ...customOptions,
    customCss:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css'
  });

  useContainer(app.select(AppModule), {
    fallbackOnErrors: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: false
    })
  );

  app.use(cookieParser());
  
  // Add debug logging for better troubleshooting
  console.log(`Starting NestJS server on port: ${port}`);
  await app.listen(port);
  console.log(`Application listening in port: ${port}`);
}

bootstrap();
