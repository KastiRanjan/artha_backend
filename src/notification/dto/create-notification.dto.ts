import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";
import { NotificationType } from "../enums/notification-type.enum";

export class CreateNotificationDto {

    @IsArray()
    users: string[];

    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    link?: string;

    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType;

}
