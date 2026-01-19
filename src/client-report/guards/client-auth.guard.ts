import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientUserService } from '../client-user.service';

@Injectable()
export class ClientAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly clientUserService: ClientUserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Get token from cookie or Authorization header
    let token = request.cookies?.ClientAuth;
    
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new UnauthorizedException('Client authentication required');
    }

    try {
      const payload = this.jwtService.verify(token);
      
      // Verify this is a client token
      if (payload.type !== 'client') {
        throw new UnauthorizedException('Invalid client token');
      }

      // Get the full user object
      const user = await this.clientUserService.getProfile(payload.sub);
      
      if (user.status !== 'active') {
        throw new UnauthorizedException('Account is not active');
      }

      // Attach user to request with selected customerId from token
      request.clientUser = user;
      request.clientUser.selectedCustomerId = payload.customerId;
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
