import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EmailTemplateService } from '../email-template.service';
import { CreateEmailTemplateDto } from '../dto/create-email-template.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailTemplateEntity } from '../entities/email-template.entity';

@Injectable()
export class EmailTemplateSeedService implements OnModuleInit {
  private readonly logger = new Logger(EmailTemplateSeedService.name);

  constructor(
    private readonly emailTemplateService: EmailTemplateService,
    @InjectRepository(EmailTemplateEntity)
    private readonly emailTemplateRepository: Repository<EmailTemplateEntity>
  ) {}

  async onModuleInit() {
    try {
      // Check if notice-board template exists by slug
      const existingTemplateBySlug = await this.emailTemplateRepository.findOne({ 
        where: { slug: 'notice-board' } 
      });
      
      // Also check by title since that might be a unique constraint
      const existingTemplateByTitle = await this.emailTemplateRepository.findOne({ 
        where: { title: 'Notice Board Notification' } 
      });
      
      if (!existingTemplateBySlug && !existingTemplateByTitle) {
        // Create notice-board email template directly using repository to avoid validation errors
        const noticeTemplate = this.emailTemplateRepository.create({
          title: 'Notice Board Notification',
          sender: 'no-reply@example.com', // Update with your actual sender email
          subject: 'New Notice: {{noticeTitle}}',
          slug: 'notice-board',
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
              <img src="{{imageUrl}}" alt="Notice Image" style="max-width: 100%; height: auto;" />
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
        
        await this.emailTemplateRepository.save(noticeTemplate);
        this.logger.log('Notice board email template created successfully');
      } else {
        this.logger.log('Notice board email template already exists, skipping creation');
      }
    } catch (error) {
      this.logger.error(`Failed to create notice board email template: ${error.message}`);
    }
  }
}