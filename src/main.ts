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

  // Dynamic configuration based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const isCloudflareSetup = process.env.FRONTEND_URL?.includes('https://') || process.env.BACKEND_URL?.includes('https://');
  const isLocalhost = process.env.FRONTEND_URL?.includes('localhost') || process.env.BACKEND_URL?.includes('localhost');

  // Dynamic CORS origins based on environment
  const corsOrigins = [];
  
  // Add configured URLs from environment
  if (process.env.FRONTEND_URL) {
    corsOrigins.push(process.env.FRONTEND_URL);
  }
  if (process.env.BACKEND_URL) {
    corsOrigins.push(process.env.BACKEND_URL);
  }
  
  // Add localhost origins for development
  if (!isProduction || isLocalhost) {
    corsOrigins.push(
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      'http://127.0.0.1:5173',
      'http://192.168.18.58:5173'
    );
  }

  // Setup CORS with dynamic configuration
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true, // Essential for cookies
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cookie'
    ],
    exposedHeaders: ['Set-Cookie'], // Allow frontend to see Set-Cookie headers
    optionsSuccessStatus: 200 // For legacy browser support
  });

  // Security middleware - configure helmet based on environment
  const helmetConfig: any = {
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  };

  // Add CSP only for production or HTTPS setups
  if (isProduction || isCloudflareSetup) {
    helmetConfig.contentSecurityPolicy = {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'", 
          ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
          ...(process.env.BACKEND_URL ? [process.env.BACKEND_URL] : [])
        ]
      }
    };
  }

  app.use(helmet(helmetConfig));

  // Cookie parser middleware
  app.use(cookieParser());

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

  // Add debug logging for better troubleshooting
  console.log('🚀 Starting NestJS server...');
  console.log(`📍 Port: ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`� Setup Type: ${isCloudflareSetup ? 'Cloudflare Tunnel' : 'Localhost'}`);
  console.log(`�🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 Backend URL: ${process.env.BACKEND_URL}`);
  console.log(`🍪 Cookie Domain: ${process.env.COOKIE_DOMAIN || 'Not set'}`);
  console.log(`🔒 SameSite: ${process.env.IS_SAME_SITE}`);
  console.log(`📡 CORS Origins:`, corsOrigins);
  console.log(`🛡️  Security (CSP): ${isProduction || isCloudflareSetup ? 'Enabled' : 'Disabled'}`);
  
  await app.listen(port);
  console.log(`✅ Application listening on port: ${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api-docs`);
  
  if (isCloudflareSetup) {
    console.log(`🌐 Public access via: ${process.env.BACKEND_URL}/api-docs`);
  }
}

bootstrap();
