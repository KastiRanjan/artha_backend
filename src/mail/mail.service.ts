import { Injectable } from '@nestjs/common';

import { MailerService } from '@nestjs-modules/mailer';
import { EmailTemplateService } from 'src/email-template/email-template.service';
import { MailJobInterface } from 'src/mail/interface/mail-job.interface';

@Injectable()
export class MailService {
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
    Object.keys(obj).forEach((key) => {
      const placeHolder = `{{${key}}}`;
      if (newStr.includes(placeHolder)) {
        newStr = newStr.replace(placeHolder, obj[key] || ' ');
      }
    });
    return newStr;
  }

  async sendMail(payload: MailJobInterface, type: string): Promise<boolean> {
    const { to, subject, slug, context } = payload;
    const mailBody = await this.emailTemplateService.findBySlug(slug);
    if (!mailBody) {
      return false;
    }
    const emailContent = this.stringInject(mailBody.body, context);
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html: emailContent
      });
      return true;
    } catch (error) {
      console.error('Failed to send email', error);
      return false;
    }
  }
}
