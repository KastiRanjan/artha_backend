import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplateEntity } from './entities/email-template.entity';

@Injectable()
export class EmailTemplateSeederService {
  private readonly logger = new Logger(EmailTemplateSeederService.name);

  constructor(
    @InjectRepository(EmailTemplateEntity)
    private readonly emailTemplateRepository: Repository<EmailTemplateEntity>,
  ) {}

  /**
   * Seed required email templates for attendance reminders
   * Only creates templates that don't already exist (based on slug)
   */
  async seedAttendanceTemplates(): Promise<void> {
    this.logger.log('Starting attendance email template seeding...');

    const templates = [
      {
        slug: 'clock-in-reminder',
        title: 'Clock-In Reminder',
        sender: process.env.MAIL_FROM || 'noreply@artha.com',
        subject: 'Reminder: Please Clock In',
        isDefault: true,
        body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clock-In Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏰ Clock-In Reminder</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Hello <strong>{{userName}}</strong>,
                            </p>
                            
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                This is a friendly reminder that you haven't clocked in yet today.
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                                <tr>
                                    <td>
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                                            📅 <strong>Date:</strong> {{currentDate}}
                                        </p>
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                                            ⏰ <strong>Expected Clock-In Time:</strong> {{expectedTime}}
                                        </p>
                                        <p style="color: #666666; font-size: 14px; margin: 0;">
                                            ⌛ <strong>Grace Period:</strong> {{gracePeriod}} minutes
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                                Please clock in as soon as possible to ensure accurate attendance records.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{{clockInUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                                    Clock In Now
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                This is an automated reminder. Please do not reply to this email.
                            </p>
                            <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                                © {{currentYear}} {{companyName}}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim(),
        status: 'active',
      },
      {
        slug: 'clock-out-reminder',
        title: 'Clock-Out Reminder',
        sender: process.env.MAIL_FROM || 'noreply@artha.com',
        subject: 'Reminder: Please Clock Out',
        isDefault: true,
        body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clock-Out Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏁 Clock-Out Reminder</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Hello <strong>{{userName}}</strong>,
                            </p>
                            
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                This is a friendly reminder that you haven't clocked out yet today.
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                                <tr>
                                    <td>
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                                            📅 <strong>Date:</strong> {{currentDate}}
                                        </p>
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                                            🕐 <strong>Clock-In Time:</strong> {{clockInTime}}
                                        </p>
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                                            ⏰ <strong>Expected Clock-Out Time:</strong> {{expectedTime}}
                                        </p>
                                        <p style="color: #666666; font-size: 14px; margin: 0;">
                                            ⌛ <strong>Grace Period:</strong> {{gracePeriod}} minutes
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                                Please clock out to complete your attendance record for today.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{{clockOutUrl}}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                                    Clock Out Now
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                This is an automated reminder. Please do not reply to this email.
                            </p>
                            <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                                © {{currentYear}} {{companyName}}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim(),
        status: 'active',
      },
    ];

    for (const template of templates) {
      try {
        // Check if template already exists
        const existing = await this.emailTemplateRepository.findOne({
          where: { slug: template.slug },
        });

        if (existing) {
          this.logger.log(`Template "${template.slug}" already exists. Skipping.`);
          continue;
        }

        // Create new template
        const newTemplate = this.emailTemplateRepository.create(template);
        await this.emailTemplateRepository.save(newTemplate);
        this.logger.log(`✅ Created template: ${template.slug}`);
      } catch (error) {
        this.logger.error(`Failed to create template "${template.slug}": ${error.message}`);
      }
    }

    this.logger.log('Email template seeding completed.');
  }
}
