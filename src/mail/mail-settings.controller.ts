import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';
import { MailSettingsService } from './mail-settings.service';
import { UpdateMailSettingsDto } from './dto/update-mail-settings.dto';

@ApiTags('mail-settings')
@Controller('mail-settings')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
export class MailSettingsController {
  constructor(private readonly mailSettingsService: MailSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get mail settings' })
  @ApiResponse({ status: 200, description: 'Mail settings retrieved successfully' })
  async getSettings() {
    return this.mailSettingsService.getSettings();
  }

  @Put()
  @ApiOperation({ summary: 'Update mail settings (requires permission)' })
  @ApiResponse({ status: 200, description: 'Mail settings updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async updateSettings(
    @Body() updateDto: UpdateMailSettingsDto,
    @GetUser() user: UserEntity,
  ) {
    return this.mailSettingsService.updateSettings(updateDto, user);
  }
}
