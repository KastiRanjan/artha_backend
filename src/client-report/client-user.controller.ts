import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ClientUserService } from './client-user.service';
import { CreateClientUserDto, UpdateClientUserDto } from './dto/client-user.dto';
import { ClientUser } from './entities/client-user.entity';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';

@ApiTags('client-users')
@Controller('client-users')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
export class ClientUserController {
  constructor(private readonly clientUserService: ClientUserService) {}

  /**
   * Admin: Create a new client user
   */
  @Post()
  async create(
    @Body() createDto: CreateClientUserDto,
    @GetUser() user: UserEntity
  ): Promise<ClientUser> {
    return this.clientUserService.create(createDto, user.id);
  }

  /**
   * Admin: Get all client users
   */
  @Get()
  async findAll(@Query('customerId') customerId?: string): Promise<ClientUser[]> {
    return this.clientUserService.findAll(customerId);
  }

  /**
   * Admin: Get single client user
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ClientUser> {
    return this.clientUserService.findOne(id);
  }

  /**
   * Admin: Update client user
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateClientUserDto,
    @GetUser() user: UserEntity
  ): Promise<ClientUser> {
    return this.clientUserService.update(id, updateDto, user.id);
  }

  /**
   * Admin: Delete client user
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.clientUserService.remove(id);
    return { success: true };
  }
}
