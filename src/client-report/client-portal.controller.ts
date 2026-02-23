import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
  Req,
  StreamableFile,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

import { ClientUserService } from './client-user.service';
import { ClientReportService } from './client-report.service';
import {
  ClientLoginDto,
  ClientForgotPasswordDto,
  ClientResetPasswordDto,
  ClientChangePasswordDto
} from './dto/client-user.dto';
import { ClientUser } from './entities/client-user.entity';
import { ClientReport } from './entities/client-report.entity';
import { ClientReportFile } from './entities/client-report-file.entity';
import { ClientAuthGuard } from './guards/client-auth.guard';
import { GetClientUser } from './decorators/get-client-user.decorator';

@ApiTags('client-portal')
@Controller('client-portal')
export class ClientPortalController {
  constructor(
    private readonly clientUserService: ClientUserService,
    private readonly clientReportService: ClientReportService
  ) {}

  /**
   * Client login
   */
  @Post('login')
  async login(
    @Body() loginDto: ClientLoginDto,
    @Res() response: Response
  ) {
    const result = await this.clientUserService.login(loginDto);
    
    // Set cookie for client authentication
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    };
    
    response.cookie('ClientAuth', result.token, cookieOptions);
    
    return response.json({
      success: true,
      token: result.token,
      user: result.user,
      customers: result.customers
    });
  }

  /**
   * Client logout
   */
  @Post('logout')
  async logout(@Res() response: Response) {
    response.clearCookie('ClientAuth');
    return response.json({ success: true });
  }

  /**
   * Get current client profile
   */
  @Get('profile')
  @UseGuards(ClientAuthGuard)
  async getProfile(@GetClientUser() user: ClientUser): Promise<Partial<ClientUser>> {
    const profile = await this.clientUserService.getProfile(user.id);
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phoneNumber: profile.phoneNumber,
      customers: profile.customers,
      status: profile.status,
      isDownloadDisabled: profile.isDownloadDisabled || false
    };
  }

  // ===== Client Portal: Projects =====

  @Get('projects')
  @UseGuards(ClientAuthGuard)
  async getMyProjects(@GetClientUser() user: ClientUser) {
    const customerIds = (user as any).customerIds || [];
    if (!customerIds.length) {
      return [];
    }
    return this.clientReportService.getClientProjects(customerIds);
  }

  @Get('projects/:id')
  @UseGuards(ClientAuthGuard)
  async getProjectDetail(
    @Param('id') id: string,
    @GetClientUser() user: ClientUser
  ) {
    const customerIds = (user as any).customerIds || [];
    if (!customerIds.length) {
      throw new ForbiddenException('No customer access');
    }
    return this.clientReportService.getClientProjectById(id, customerIds);
  }

  // ===== Client Portal: Company =====

  @Get('company')
  @UseGuards(ClientAuthGuard)
  async getCompanyDetails(@GetClientUser() user: ClientUser) {
    const customerIds = (user as any).customerIds || [];
    if (!customerIds.length) {
      return [];
    }
    return this.clientReportService.getAllCustomerDetails(customerIds);
  }

  /**
   * Get reports for the logged-in client (across all associated customers)
   */
  @Get('reports')
  @UseGuards(ClientAuthGuard)
  async getMyReports(@GetClientUser() user: ClientUser): Promise<ClientReport[]> {
    const customerIds = (user as any).customerIds || [];
    if (!customerIds.length) {
      return [];
    }
    return this.clientReportService.findByCustomerIds(customerIds);
  }

  /**
   * Get report stats for the logged-in client (across all associated customers)
   */
  @Get('reports/stats')
  @UseGuards(ClientAuthGuard)
  async getMyStats(
    @GetClientUser() user: ClientUser
  ): Promise<{ total: number; accessible: number; pending: number }> {
    const customerIds = (user as any).customerIds || [];
    if (!customerIds.length) {
      return { total: 0, accessible: 0, pending: 0 };
    }
    return this.clientReportService.getCustomerStats(customerIds);
  }

  /**
   * Download a report file (only if access is granted)
   * Downloads the first/legacy file. Use /reports/:id/files/:fileId/download for specific files.
   */
  @Get('reports/:id/download')
  @UseGuards(ClientAuthGuard)
  async downloadReport(
    @Param('id') id: string,
    @GetClientUser() user: ClientUser,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    // Master download disable check
    if (user.isDownloadDisabled) {
      throw new BadRequestException('File downloads have been disabled for your account. Please contact the administrator.');
    }

    const customerIds = (user as any).customerIds || [];
    if (!customerIds.length) {
      throw new ForbiddenException('No customer access');
    }
    
    const { canDownload, report, reason } =
      await this.clientReportService.canClientDownload(id, customerIds);

    if (!canDownload) {
      throw new BadRequestException(reason);
    }

    // Try to use the files relation first, fall back to legacy filePath
    let filePathToUse = report.filePath;
    let fileNameToUse = report.originalFileName;
    let fileTypeToUse = report.fileType;

    if (report.files && report.files.length > 0) {
      const firstFile = report.files[0];
      filePathToUse = firstFile.filePath;
      fileNameToUse = firstFile.displayFileName || firstFile.originalFileName;
      fileTypeToUse = firstFile.fileType;
    }

    const filePath = join(process.cwd(), 'public', filePathToUse);

    if (!existsSync(filePath)) {
      throw new BadRequestException('File not found on server');
    }

    const file = createReadStream(filePath);
    
    response.set({
      'Content-Type': fileTypeToUse || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileNameToUse}"`
    });

    return new StreamableFile(file);
  }

  /**
   * Download a specific file from a report by file ID
   */
  @Get('reports/:id/files/:fileId/download')
  @UseGuards(ClientAuthGuard)
  async downloadReportFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @GetClientUser() user: ClientUser,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    // Master download disable check
    if (user.isDownloadDisabled) {
      throw new BadRequestException('File downloads have been disabled for your account. Please contact the administrator.');
    }

    const customerIds = (user as any).customerIds || [];
    if (!customerIds.length) {
      throw new ForbiddenException('No customer access');
    }
    
    const { canDownload, report, reason } =
      await this.clientReportService.canClientDownload(id, customerIds);

    if (!canDownload) {
      throw new BadRequestException(reason);
    }

    // Find the specific file
    const reportFile = report.files?.find(f => f.id === fileId);
    if (!reportFile) {
      throw new BadRequestException('File not found in this report');
    }

    const filePath = join(process.cwd(), 'public', reportFile.filePath);

    if (!existsSync(filePath)) {
      throw new BadRequestException('File not found on server');
    }

    const file = createReadStream(filePath);
    
    response.set({
      'Content-Type': reportFile.fileType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${reportFile.displayFileName || reportFile.originalFileName}"`
    });

    return new StreamableFile(file);
  }

  /**
   * View report details (client can see details even if download is locked)
   */
  @Get('reports/:id')
  @UseGuards(ClientAuthGuard)
  async getReportDetails(
    @Param('id') id: string,
    @GetClientUser() user: ClientUser
  ): Promise<{ report: ClientReport; canDownload: boolean; downloadMessage?: string }> {
    const customerIds = (user as any).customerIds || [];
    if (!customerIds.length) {
      throw new ForbiddenException('No customer access');
    }
    
    const { canDownload: serviceCanDownload, report, reason } =
      await this.clientReportService.canClientDownload(id, customerIds);

    // Also check master download disable
    const isDisabled = user.isDownloadDisabled;
    const canDownload = serviceCanDownload && !isDisabled;
    const downloadMessage = isDisabled
      ? 'File downloads have been disabled for your account. Please contact the administrator.'
      : (canDownload ? undefined : reason);

    return {
      report,
      canDownload,
      downloadMessage
    };
  }

  /**
   * Forgot password
   */
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotDto: ClientForgotPasswordDto
  ): Promise<{ success: boolean; message: string }> {
    await this.clientUserService.forgotPassword(forgotDto);
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    };
  }

  /**
   * Reset password with token
   */
  @Post('reset-password')
  async resetPassword(
    @Body() resetDto: ClientResetPasswordDto
  ): Promise<{ success: boolean }> {
    await this.clientUserService.resetPassword(resetDto);
    return { success: true };
  }

  /**
   * Change password (authenticated)
   */
  @Post('change-password')
  @UseGuards(ClientAuthGuard)
  async changePassword(
    @GetClientUser() user: ClientUser,
    @Body() changeDto: ClientChangePasswordDto
  ): Promise<{ success: boolean }> {
    await this.clientUserService.changePassword(user.id, changeDto);
    return { success: true };
  }
}
