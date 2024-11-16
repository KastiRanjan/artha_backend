import { IsArray } from "class-validator";

export class CreateNotificationDto {

    @IsArray()
    users: string[];

    message: string;

    link?: string;

}
