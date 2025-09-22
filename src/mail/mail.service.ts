import { Injectable, Logger } from '@nestjs/common';

import { MailerService } from '@nestjs-modules/mailer';
import { EmailTemplateService } from 'src/email-template/email-template.service';
import { MailJobInterface } from 'src/mail/interface/mail-job.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');

  constructor(
    // @InjectQueue(config.get('mail.queueName'))
    // private mailQueue: Queue,
    private readonly emailTemplateService: EmailTemplateService,
    private mailerService: MailerService
  ) {}

  /**
   * Replace place holder
   * @param str
   * @param obj
   */
  stringInject(str = '', obj = {}) {
    let newStr = str;
    
    // Handle conditional blocks like {{#if imageUrl}} content {{/if}}
    const conditionalRegex = /{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g;
    newStr = newStr.replace(conditionalRegex, (match, condition, content) => {
      const value = obj[condition];
      return value ? content : '';
    });
    
    // Replace regular placeholders {{key}}
    Object.keys(obj).forEach((key) => {
      const placeHolder = `{{${key}}}`;
      if (newStr.includes(placeHolder)) {
        newStr = newStr.replace(new RegExp(placeHolder, 'g'), obj[key] || '');
      }
    });
    
    return newStr;
  }

  async sendMail(payload: MailJobInterface, type: string): Promise<boolean> {
    this.logger.log(`Attempting to send email to ${payload.to} with subject: ${payload.subject}`);
    
    const { to, subject, slug, context } = payload;
    const mailBody = await this.emailTemplateService.findBySlug(slug);
    
    if (!mailBody) {
      this.logger.error(`Email template with slug '${slug}' not found - attempting to create it`);
      
      // Let's just log the issue without checking all templates
      this.logger.log(`Please run 'npm run seed:email-template' to create the missing template`);
      
      return false;
    }
    
    const emailContent = this.stringInject(mailBody.body, context);
    
    try {
      this.logger.log(`Sending email to ${to}`);
      
      // Prepare mail options
      const mailOptions: any = {
        to,
        subject,
        html: emailContent
      };
      
      // Check if there's an image URL to attach
      if (context.imageUrl && typeof context.imageUrl === 'string') {
        this.logger.log(`Email includes image: ${context.imageUrl}`);
        
        // Extract image name from URL
        const imageName = context.imageUrl.split('/').pop() || 'image.jpg';
        
        // If we have an image URL, include it as an attachment with a Content-ID
        mailOptions.attachments = [
          {
            filename: imageName,
            path: context.imageUrl,
            cid: 'notice-image' // Content ID to reference in the HTML
          }
        ];
        
        // Replace all occurrences of the image URL with the CID reference
        mailOptions.html = mailOptions.html.replace(
          new RegExp(context.imageUrl, 'g'), 
          'cid:notice-image'
        );
      }
      
      const result = await this.mailerService.sendMail(mailOptions);
      
      this.logger.log(`Email sent successfully to ${to}, messageId: ${result?.messageId || 'N/A'}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      console.error('Failed to send email', error);
      return false;
    }
  }
}
