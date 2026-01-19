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
  ClientChangePasswordDto,
  SelectCustomerDto
} from './dto/client-user.dto';
import { ClientUser } from './entities/client-user.entity';
import { ClientReport } from './entities/client-report.entity';
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
      customers: result.customers,
      needsCustomerSelection: result.customers.length > 1 && !loginDto.customerId
    });
  }

  /**
   * Switch to a different customer
   */
  @Post('switch-customer')
  @UseGuards(ClientAuthGuard)
  async switchCustomer(
    @Body() selectDto: SelectCustomerDto,
    @GetClientUser() user: ClientUser,
    @Res() response: Response
  ) {
    const result = await this.clientUserService.switchCustomer(user.id, selectDto.customerId);
    
    // Set new cookie with updated token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60 * 1000
    };
    
    response.cookie('ClientAuth', result.token, cookieOptions);
    
    return response.json({
      success: true,
      token: result.token,
      customer: result.customer
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
      selectedCustomerId: user.selectedCustomerId,
      customers: profile.customers,
      status: profile.status
    };
  }

  /**
   * Get reports for the logged-in client's selected customer
   */
  @Get('reports')
  @UseGuards(ClientAuthGuard)
  async getMyReports(@GetClientUser() user: ClientUser): Promise<ClientReport[]> {
    if (!user.selectedCustomerId) {
      throw new ForbiddenException('Please select a customer first');
    }
    return this.clientReportService.findByCustomerId(user.selectedCustomerId);
  }

  /**
   * Get report stats for the logged-in client
   */
  @Get('reports/stats')
  @UseGuards(ClientAuthGuard)
  async getMyStats(
    @GetClientUser() user: ClientUser
  ): Promise<{ total: number; accessible: number; pending: number }> {
    if (!user.selectedCustomerId) {
      throw new ForbiddenException('Please select a customer first');
    }
    return this.clientReportService.getCustomerStats(user.selectedCustomerId);
  }

  /**
   * Download a report file (only if access is granted)
   */
  @Get('reports/:id/download')
  @UseGuards(ClientAuthGuard)
  async downloadReport(
    @Param('id') id: string,
    @GetClientUser() user: ClientUser,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    if (!user.selectedCustomerId) {
      throw new ForbiddenException('Please select a customer first');
    }
    
    const { canDownload, report, reason } =
      await this.clientReportService.canClientDownload(id, user.selectedCustomerId);

    if (!canDownload) {
      throw new BadRequestException(reason);
    }

    const filePath = join(process.cwd(), 'public', report.filePath);

    if (!existsSync(filePath)) {
      throw new BadRequestException('File not found on server');
    }

    const file = createReadStream(filePath);
    
    response.set({
      'Content-Type': report.fileType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${report.originalFileName}"`
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
    if (!user.selectedCustomerId) {
      throw new ForbiddenException('Please select a customer first');
    }
    
    const { canDownload, report, reason } =
      await this.clientReportService.canClientDownload(id, user.selectedCustomerId);

    return {
      report,
      canDownload,
      downloadMessage: canDownload ? undefined : reason
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
