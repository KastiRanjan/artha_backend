import { IsOptional, IsString } from 'class-validator';

export class RejectDsaDto {
  @IsOptional()
  @IsString()
  adminRemarks?: string;
}
