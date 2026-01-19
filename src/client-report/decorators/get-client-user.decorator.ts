import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ClientUser } from '../entities/client-user.entity';

export const GetClientUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ClientUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.clientUser;
  }
);
