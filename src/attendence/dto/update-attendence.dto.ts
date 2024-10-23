import { PartialType } from '@nestjs/swagger';
import { CreateAttendanceDto } from './create-attendence.dto';

export class UpdateAttendenceDto extends PartialType(CreateAttendanceDto) {}
