import { PartialType } from '@nestjs/mapped-types';
import { CreateClientGroupDto } from './create-client-group.dto';

export class UpdateClientGroupDto extends PartialType(CreateClientGroupDto) {}
