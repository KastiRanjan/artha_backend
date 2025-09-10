import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { PortalCredentialsService } from './portal-credentials.service';
import { CreatePortalCredentialDto, UpdatePortalCredentialDto } from './dto/portal-credential.dto';

@ApiTags('portal-credentials')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('portal-credentials')
@ApiBearerAuth()
export class StandalonePortalCredentialsController {
  constructor(private readonly portalCredentialsService: PortalCredentialsService) {}

  @Post(':customerId')
  create(
    @Param('customerId') customerId: string,
    @Body() createPortalCredentialDto: CreatePortalCredentialDto
  ) {
    return this.portalCredentialsService.create(customerId, createPortalCredentialDto);
  }

  @Get()
  findAll() {
    return this.portalCredentialsService.findAll();
  }

  @Get('customer/:customerId')
  findAllByCustomer(@Param('customerId') customerId: string) {
    return this.portalCredentialsService.findAllByCustomer(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.portalCredentialsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePortalCredentialDto: UpdatePortalCredentialDto
  ) {
    return this.portalCredentialsService.update(id, updatePortalCredentialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.portalCredentialsService.remove(id);
  }
}
