import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepository } from 'typeorm';
import { EmailTemplateEntity } from './email-template/entities/email-template.entity';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('EmailTemplateSeeder');
  const app = await NestFactory.create(AppModule);
  
  try {
    const emailTemplateRepository = getRepository(EmailTemplateEntity);
    
    // Check if notice-board template exists by slug
    const existingTemplateBySlug = await emailTemplateRepository.findOne({ 
      where: { slug: 'notice-board-notification' } 
    });
    
    // Also check by title since that might be a unique constraint
    const existingTemplateByTitle = await emailTemplateRepository.findOne({ 
      where: { title: 'Notice Board Notification' } 
    });
    
    if (!existingTemplateBySlug && !existingTemplateByTitle) {
      // Create notice-board email template directly using repository
      const noticeTemplate = emailTemplateRepository.create({
        title: 'Notice Board Notification',
        sender: 'no-reply@example.com',
        subject: 'New Notice: {{noticeTitle}}',
        slug: 'notice-board-notification',
        body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">{{noticeTitle}}</h1>
          <p>Hello {{name}},</p>
          <p>A new notice has been posted that requires your attention.</p>
          <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background-color: #f8f9fa;">
            <p>{{noticeDescription}}</p>
          </div>
          {{#if imageUrl}}
          <div style="margin: 20px 0;">
            <img src="{{imageUrl}}" alt="Notice Image" style="max-width: 100%; height: auto; border: 1px solid #eaeaea; border-radius: 4px;" />
          </div>
          {{/if}}
          <p>Please log in to your account to view this notice in detail.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
        `,
        isDefault: false
      });
      
      await emailTemplateRepository.save(noticeTemplate);
      logger.log('Notice board email template created successfully');
    } else {
      logger.log('Notice board email template already exists, skipping creation');
    }
    
    logger.log('All email templates:');
    const allTemplates = await emailTemplateRepository.find();
    logger.log(allTemplates.map(t => `${t.id}: ${t.slug} - ${t.title}`).join('\n'));
    
  } catch (error) {
    logger.error(`Failed to create notice board email template: ${error.message}`);
    console.error(error);
  } finally {
    await app.close();
  }
}

bootstrap();