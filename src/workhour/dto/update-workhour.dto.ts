import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkhourDto } from './create-workhour.dto';

export class UpdateWorkhourDto extends PartialType(CreateWorkhourDto) {}
