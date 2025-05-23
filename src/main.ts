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
  // const serverConfig = config.get('server');
  const port = process.env.PORT || 7777;
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../ssl/private.key')),
    cert: fs.readFileSync(path.join(__dirname, '../ssl/certificate.crt')),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions});

  // app.use(helmet({ crossOriginResourcePolicy: false }));
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  // const apiConfig = config.get('app');
  // if (process.env.NODE_ENV === 'development') {
  app.enableCors({
    origin: ['https://192.168.18.58:5173', ''],
    credentials: true
  });

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
  // } else {
  //   const whitelist = [apiConfig.get<string>('frontendUrl')];
  //   app.enableCors({
  //     origin: true,
  //     credentials: true
  //   });
  // app.enableCors({
  //   origin: function (origin, callback) {
  //     if (!origin || whitelist.indexOf(origin) !== -1) {
  //       callback(null, true);
  //     } else {
  //       callback(new Error('Not allowed by CORS'));
  //     }
  //   },
  //   credentials: true
  // });
  // }
  useContainer(app.select(AppModule), {
    fallbackOnErrors: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  app.use(cookieParser());
  await app.listen(port);
  console.log(`Application listening in port: ${port}`);
}

bootstrap();
