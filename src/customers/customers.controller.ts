import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { BoardMemberInputDto, CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateClientTimelineDto } from './dto/client-timeline.dto';
import { CreateLicenseDto, UpdateLicenseDto } from './dto/license.dto';
import { CreateOtherInfoDto, UpdateOtherInfoDto } from './dto/other-info.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';

@ApiTags('client')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('clients')
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto, @GetUser() user?: UserEntity) {
    return this.customersService.create(createCustomerDto, user);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('status') status?: string) {
    if (status && status.toLowerCase() !== 'all') {
      return this.customersService.findByStatus(status);
    }
    return this.customersService.findAll();
  }

  @Get('similarity-check')
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'pan', required: false })
  @ApiQuery({ name: 'excludeId', required: false })
  checkSimilarity(
    @Query('name') name?: string,
    @Query('pan') pan?: string,
    @Query('excludeId') excludeId?: string
  ) {
    return this.customersService.checkSimilarity(name, pan, excludeId);
  }

  @Get('duplication-audit')
  getDuplicationAuditReport() {
    return this.customersService.getDuplicationAuditReport();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user?: UserEntity) {
    return this.customersService.findOne(id, user);
  }

  @Get(':id/licenses')
  getLicenses(@Param('id') id: string) {
    return this.customersService.getLicenses(id);
  }

  @Post(':id/licenses')
  addLicense(
    @Param('id') id: string,
    @Body() dto: CreateLicenseDto,
    @GetUser() user?: UserEntity
  ) {
    return this.customersService.addLicense(id, dto, user);
  }

  @Patch(':id/licenses/:licenseId')
  updateLicense(
    @Param('id') id: string,
    @Param('licenseId') licenseId: string,
    @Body() dto: UpdateLicenseDto,
    @GetUser() user?: UserEntity
  ) {
    return this.customersService.updateLicense(id, licenseId, dto, user);
  }

  @Delete(':id/licenses/:licenseId')
  deleteLicense(
    @Param('id') id: string,
    @Param('licenseId') licenseId: string
  ) {
    return this.customersService.deleteLicense(id, licenseId);
  }

  @Get(':id/other-info')
  getOtherInfo(@Param('id') id: string) {
    return this.customersService.getOtherInfo(id);
  }

  @Post(':id/other-info')
  addOtherInfo(
    @Param('id') id: string,
    @Body() dto: CreateOtherInfoDto,
    @GetUser() user?: UserEntity
  ) {
    return this.customersService.addOtherInfo(id, dto, user);
  }

  @Patch(':id/other-info/:infoId')
  updateOtherInfo(
    @Param('id') id: string,
    @Param('infoId') infoId: string,
    @Body() dto: UpdateOtherInfoDto,
    @GetUser() user?: UserEntity
  ) {
    return this.customersService.updateOtherInfo(id, infoId, dto, user);
  }

  @Delete(':id/other-info/:infoId')
  deleteOtherInfo(
    @Param('id') id: string,
    @Param('infoId') infoId: string
  ) {
    return this.customersService.deleteOtherInfo(id, infoId);
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.customersService.getTimeline(id);
  }

  @Post(':id/timeline')
  addTimelineEvent(
    @Param('id') id: string,
    @Body() dto: CreateClientTimelineDto,
    @GetUser() user?: UserEntity
  ) {
    return this.customersService.addTimelineEvent(id, dto, user);
  }

  @Delete(':id/timeline/:eventId')
  deleteTimelineEvent(
    @Param('id') id: string,
    @Param('eventId') eventId: string
  ) {
    return this.customersService.deleteTimelineEvent(id, eventId);
  }

  @Post(':id/board-members')
  addBoardMember(
    @Param('id') id: string,
    @Body() dto: BoardMemberInputDto,
    @GetUser() user?: UserEntity
  ) {
    return this.customersService.addBoardMember(id, dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @GetUser() user?: UserEntity
  ) {
    return this.customersService.update(id, updateCustomerDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
