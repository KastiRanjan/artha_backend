import { PartialType } from '@nestjs/swagger';
import { CreateNoticeBoardDto } from './create-notice-board.dto';

export class UpdateNoticeBoardDto extends PartialType(CreateNoticeBoardDto) {}