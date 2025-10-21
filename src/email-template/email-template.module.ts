import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailTemplateService } from 'src/email-template/email-template.service';
import { EmailTemplateController } from 'src/email-template/email-template.controller';
import { AuthModule } from 'src/auth/auth.module';
import { UniqueValidatorPipe } from 'src/common/pipes/unique-validator.pipe';
import { EmailTemplateRepository } from 'src/email-template/email-template.repository';
import { EmailTemplateSeedService } from './seed/email-template.seed.service';
import { EmailTemplateEntity } from './entities/email-template.entity';
import { EmailTemplateSeederService } from './email-template-seeder.service';
import { UpdateTemplatesService } from './update-templates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailTemplateRepository, EmailTemplateEntity]),
    forwardRef(() => AuthModule)
  ],
  exports: [EmailTemplateService, EmailTemplateSeederService, UpdateTemplatesService],
  controllers: [EmailTemplateController],
  providers: [EmailTemplateService, UniqueValidatorPipe, EmailTemplateSeedService, EmailTemplateSeederService, UpdateTemplatesService]
})
export class EmailTemplateModule {}
