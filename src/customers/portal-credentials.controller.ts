import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';
import { PortalCredentialsService } from './portal-credentials.service';
import { CreatePortalCredentialDto, UpdatePortalCredentialDto } from './dto/portal-credential.dto';
import { assertAdminOrSuperUser } from './utils/role-access.util';

@ApiTags('client-portal-credentials')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('clients/:customerId/portal-credentials')
@ApiBearerAuth()
export class PortalCredentialsController {
  constructor(private readonly portalCredentialsService: PortalCredentialsService) {}

  @Post()
  create(
    @Param('customerId') customerId: string,
    @Body() createPortalCredentialDto: CreatePortalCredentialDto,
    @GetUser() user?: UserEntity
  ) {
    assertAdminOrSuperUser(user);
    return this.portalCredentialsService.create(customerId, createPortalCredentialDto);
  }

  @Get()
  findAll(@Param('customerId') customerId: string, @GetUser() user?: UserEntity) {
    assertAdminOrSuperUser(user);
    return this.portalCredentialsService.findAllByCustomer(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user?: UserEntity) {
    assertAdminOrSuperUser(user);
    return this.portalCredentialsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePortalCredentialDto: UpdatePortalCredentialDto,
    @GetUser() user?: UserEntity
  ) {
    assertAdminOrSuperUser(user);
    return this.portalCredentialsService.update(id, updatePortalCredentialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user?: UserEntity) {
    assertAdminOrSuperUser(user);
    return this.portalCredentialsService.remove(id);
  }
}
