import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as config from 'config';
import * as dotenv from 'dotenv';
dotenv.config();
import { MailService } from 'src/mail/mail.service';
import { MailProcessor } from 'src/mail/mail.processor';
import { MailSettingsService } from 'src/mail/mail-settings.service';
import { MailSettingsController } from 'src/mail/mail-settings.controller';
import { MailSettings } from 'src/mail/entities/mail-settings.entity';
import { EmailTemplateModule } from 'src/email-template/email-template.module';
import { EmailTemplateService } from 'src/email-template/email-template.service';

// const mailConfig = config.get('mail');
const mailConfig = {
  host: 'smtp.mailtrap.io',
  port: 2525,
  user: process.env.MAIL_USER || '92a3a402cff43b',
  pass:  process.env.MAIL_PASS || '7b68114288934b',
  from: 'truthycms',
  fromMail: 'truthycms@gmail.com',
  preview: true,
  secure: false,
  ignoreTLS: true,
  queueName: 'truthy-mail',
}
// const queueConfig = config.get('queue');

@Module({
  imports: [
    TypeOrmModule.forFeature([MailSettings]),
    EmailTemplateModule,
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.MAIL_HOST || mailConfig.host,
          port: process.env.MAIL_PORT || mailConfig.port,
          // secure: mailConfig.secure,
          // ignoreTLS: mailConfig.ignoreTLS,
          auth: {
            user: process.env.MAIL_USER || mailConfig.user,
            pass: process.env.MAIL_PASS || mailConfig.pass
          }
        }
        // defaults: {
        //   from: `"${process.env.MAIL_FROM || mailConfig.from}" <${
        //     process.env.MAIL_FROM || mailConfig.fromMail
        //   }>`
        // },
        // preview: mailConfig.preview,
        // template: {
        //   dir: __dirname + '/templates/email/layouts/',
        //   adapter: new PugAdapter(),
        //   options: {
        //     strict: true
        //   }
        // }
      })
    })
  ],
  controllers: [MailSettingsController],
  providers: [MailService, MailSettingsService],
  exports: [MailService, MailSettingsService]
})
export class MailModule { }
