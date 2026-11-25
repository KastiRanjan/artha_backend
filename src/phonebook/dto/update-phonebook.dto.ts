import { PartialType } from '@nestjs/swagger';
import { CreatePhonebookDto } from './create-phonebook.dto';

export class UpdatePhonebookDto extends PartialType(CreatePhonebookDto) {}
