import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import * as config from 'config';
import { InjectQueue } from '@nestjs/bull';

import { MailJobInterface } from 'src/mail/interface/mail-job.interface';
import { EmailTemplateService } from 'src/email-template/email-template.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(
    // @InjectQueue(config.get('mail.queueName'))
    // private mailQueue: Queue,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly mailerService: MailerService
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
    const mailBody = await this.emailTemplateService.findBySlug(payload.slug);
    payload.context.content = this.stringInject(mailBody.body, payload.context);

    console.log(mailBody);
    try {
      {
        if (mailBody) {
          this.mailerService
            .sendMail({
              to: payload.to,
              from: 'wL2VJ@example.com',
              subject: 'Testing Nest MailerModule ✔', // Subject line
              text: 'welcome', // plaintext body
              html: '<b>welcome</b>' // HTML body content
            })
            .then(() => {})
            .catch(() => {});
          return true;
        }
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
