import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateNoticeBoardDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    @IsString()
    imagePath?: string;

    @IsOptional()
    @IsArray()
    userIds?: string[];

    @IsOptional()
    @IsArray()
    roleIds?: string[];

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    sendToAll?: boolean = false;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    sendEmail?: boolean = false;
}