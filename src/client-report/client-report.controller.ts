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
  UploadedFiles,
  Res,
  StreamableFile
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

import { ClientReportService } from './client-report.service';
import {
  CreateClientReportDto,
  UpdateClientReportDto,
  UpdateReportAccessDto,
  UpdateClientReportFileDto,
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
   * Any authenticated staff: Create a new report with file upload
   */
  @Post()
  @UseGuards(JwtTwoFactorGuard)
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
        'rar',
        'png',
        'jpg',
        'jpeg'
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
   * Any authenticated staff: Upload multiple files for a client
   */
  @Post('bulk-upload')
  @UseGuards(JwtTwoFactorGuard)
  @UseInterceptors(
    FilesInterceptor(
      'files',
      20,
      multerOptionsHelper('public/document/client-reports', 50000000, [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'zip',
        'rar',
        'png',
        'jpg',
        'jpeg'
      ])
    )
  )
  @ApiConsumes('multipart/form-data')
  async createMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createDto: CreateClientReportDto,
    @GetUser() user: UserEntity
  ): Promise<ClientReport> {
    return this.clientReportService.createMultiple(createDto, files, user.id);
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
        'rar',
        'png',
        'jpg',
        'jpeg'
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
   * Admin: Add additional files to an existing report
   */
  @Post(':id/files')
  @UseGuards(JwtTwoFactorGuard)
  @UseInterceptors(
    FilesInterceptor(
      'files',
      20,
      multerOptionsHelper('public/document/client-reports', 50000000, [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'zip',
        'rar',
        'png',
        'jpg',
        'jpeg'
      ])
    )
  )
  @ApiConsumes('multipart/form-data')
  async addFiles(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: UserEntity
  ): Promise<ClientReport> {
    return this.clientReportService.addFiles(id, files, user.id);
  }

  /**
   * Admin: Remove a specific file from a report
   */
  @Delete(':id/files/:fileId')
  @UseGuards(JwtTwoFactorGuard)
  async removeFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @GetUser() user: UserEntity
  ): Promise<ClientReport> {
    return this.clientReportService.removeFile(id, fileId, user.id);
  }

  /**
   * Admin: Update a file's display name
   */
  @Patch(':id/files/:fileId')
  @UseGuards(JwtTwoFactorGuard)
  async updateFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Body() updateDto: UpdateClientReportFileDto,
    @GetUser() user: UserEntity
  ): Promise<ClientReport> {
    return this.clientReportService.updateFileDisplayName(id, fileId, updateDto.displayFileName, user.id);
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
    return this.clientReportService.findByCustomerIds([customerId]);
  }

  /**
   * Get stats for a customer
   */
  @Get('customer/:customerId/stats')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async getCustomerStats(
    @Param('customerId') customerId: string
  ): Promise<{ total: number; accessible: number; pending: number }> {
    return this.clientReportService.getCustomerStats([customerId]);
  }

  /**
   * Get projects by customer (for dropdown when creating reports).
   * Filtered to user-assigned projects for non-superusers.
   */
  @Get('customer/:customerId/projects')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async getProjectsByCustomer(
    @Param('customerId') customerId: string,
    @GetUser() user: UserEntity
  ) {
    return this.clientReportService.getProjectsByCustomer(customerId, user);
  }

  /**
   * Get all projects accessible to the current staff user (all statuses),
   * with customer info — for populating the client + project dropdowns.
   */
  @Get('staff/accessible-projects')
  @UseGuards(JwtTwoFactorGuard)
  async getAccessibleProjects(@GetUser() user: UserEntity) {
    return this.clientReportService.getAccessibleProjectsForStaff(user);
  }

  /**
   * Get reports scoped to the current staff user's accessible customers.
   */
  @Get('staff/reports')
  @UseGuards(JwtTwoFactorGuard, PermissionGuard)
  async findForStaff(
    @Query() filterDto: ClientReportFilterDto,
    @GetUser() user: UserEntity
  ): Promise<ClientReport[]> {
    return this.clientReportService.findForStaff(filterDto, user);
  }
}
