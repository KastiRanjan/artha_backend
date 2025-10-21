#!/usr/bin/env node
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

async function bootstrap() {
  console.log('🚀 Starting email template update...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const { UpdateTemplatesService } = require('../dist/email-template/update-templates.service');
  const updateService = app.get(UpdateTemplatesService);

  try {
    await updateService.updateAllTemplates();
    console.log('\n✅ All email templates updated successfully!');
  } catch (error) {
    console.error('\n❌ Error updating templates:', error.message);
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
