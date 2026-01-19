import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

import { ClientReportService } from './client-report.service';
import {
  CreateClientReportDto,
  UpdateClientReportDto,
  UpdateReportAccessDto,
  ClientReportFilterDto
} from './dto/client-report.dto';
import { multerOptionsHelper } from 'src/common/helper/multer-options.helper';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';
import { ClientReport, ReportAccessStatus } from './entities/client-report.entity';

@ApiTags('client-reports')
@Controller('client-reports')
export class ClientReportController {
  constructor(private readonly clientReportService: ClientReportService) {}

  /**
   * Admin: Create a new report with file upload
   */
  @Post()
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerOptionsHelper('public/document/client-reports', 50000000, [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'zip',
        'rar'
      ])
    )
  )
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDto: CreateClientReportDto,
    @GetUser() user: UserEntity
  ): Promise<ClientReport> {
    return this.clientReportService.create(createDto, file, user.id);
  }

  /**
   * Admin: Get all reports with filters
   */
  @Get()
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async findAll(@Query() filterDto: ClientReportFilterDto): Promise<ClientReport[]> {
    return this.clientReportService.findAll(filterDto);
  }

  /**
   * Admin: Get single report
   */
  @Get(':id')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async findOne(@Param('id') id: string): Promise<ClientReport> {
    return this.clientReportService.findOne(id);
  }

  /**
   * Admin: Update report details
   */
  @Patch(':id')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateClientReportDto,
    @GetUser() user: UserEntity
  ): Promise<ClientReport> {
    return this.clientReportService.update(id, updateDto, user.id);
  }

  /**
   * Admin: Update report access status (grant/revoke download access)
   */
  @Patch(':id/access')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async updateAccess(
    @Param('id') id: string,
    @Body() accessDto: UpdateReportAccessDto,
    @GetUser() user: UserEntity
  ): Promise<ClientReport> {
    return this.clientReportService.updateAccess(id, accessDto, user.id);
  }

  /**
   * Admin: Bulk update access for multiple reports
   */
  @Post('bulk-access')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async bulkUpdateAccess(
    @Body() body: { ids: string[]; accessStatus: ReportAccessStatus },
    @GetUser() user: UserEntity
  ): Promise<{ success: boolean }> {
    await this.clientReportService.bulkUpdateAccess(
      body.ids,
      body.accessStatus,
      user.id
    );
    return { success: true };
  }

  /**
   * Admin: Replace file for existing report
   */
  @Put(':id/file')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerOptionsHelper('public/document/client-reports', 50000000, [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'zip',
        'rar'
      ])
    )
  )
  @ApiConsumes('multipart/form-data')
  async replaceFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: UserEntity
  ): Promise<ClientReport> {
    return this.clientReportService.replaceFile(id, file, user.id);
  }

  /**
   * Admin: Delete a report
   */
  @Delete(':id')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.clientReportService.remove(id);
    return { success: true };
  }

  /**
   * Get reports by customer (for admin to view specific customer's reports)
   */
  @Get('customer/:customerId')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async findByCustomer(
    @Param('customerId') customerId: string
  ): Promise<ClientReport[]> {
    return this.clientReportService.findByCustomerId(customerId);
  }

  /**
   * Get stats for a customer
   */
  @Get('customer/:customerId/stats')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async getCustomerStats(
    @Param('customerId') customerId: string
  ): Promise<{ total: number; accessible: number; pending: number }> {
    return this.clientReportService.getCustomerStats(customerId);
  }

  /**
   * Get projects by customer (for dropdown when creating reports)
   */
  @Get('customer/:customerId/projects')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async getProjectsByCustomer(
    @Param('customerId') customerId: string
  ) {
    return this.clientReportService.getProjectsByCustomer(customerId);
  }
}
