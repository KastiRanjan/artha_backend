import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as config from 'config';

import { UserRepository } from 'src/auth/user.repository';
import { UserEntity } from 'src/auth/entity/user.entity';
import { JwtPayloadDto } from 'src/auth/dto/jwt-payload.dto';
import { UnauthorizedException } from 'src/exception/unauthorized.exception';

const cookieExtractor = (req) => {
  return req?.cookies?.Authentication;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-strategy') {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: process.env.JWT_SECRET || 'secret'
    });
  }

  /**
   * Validate if user exists and return user entity
   * @param payload
   */
  async validate(payload: JwtPayloadDto): Promise<UserEntity> {
    const { subject } = payload;
    // Do not convert to Number since IDs are UUIDs
    const user = await this.userRepository.findOne({
      where: { id: subject },
      relations: ['role', 'role.permission']
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
