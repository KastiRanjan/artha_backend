import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

import { ClientReport, ReportAccessStatus } from './entities/client-report.entity';
import {
  CreateClientReportDto,
  UpdateClientReportDto,
  UpdateReportAccessDto,
  ClientReportFilterDto
} from './dto/client-report.dto';
import { Project } from 'src/projects/entities/project.entity';

@Injectable()
export class ClientReportService {
  constructor(
    @InjectRepository(ClientReport)
    private readonly clientReportRepository: Repository<ClientReport>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>
  ) {}

  /**
   * Create a new client report (Admin only)
   */
  async create(
    createDto: CreateClientReportDto,
    file: Express.Multer.File,
    userId: string
  ): Promise<ClientReport> {
    const filePath = file.path.replace(/\\/g, '/').replace('public/', '');

    const report = this.clientReportRepository.create({
      ...createDto,
      filePath: `/${filePath}`,
      originalFileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      createdBy: userId
    });

    return this.clientReportRepository.save(report);
  }

  /**
   * Get all reports (Admin view with filters)
   */
  async findAll(filterDto: ClientReportFilterDto): Promise<ClientReport[]> {
    const query = this.clientReportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.customer', 'customer')
      .leftJoinAndSelect('report.project', 'project')
      .orderBy('report.createdAt', 'DESC');

    if (filterDto.customerId) {
      query.andWhere('report.customerId = :customerId', {
        customerId: filterDto.customerId
      });
    }

    if (filterDto.projectId) {
      query.andWhere('report.projectId = :projectId', {
        projectId: filterDto.projectId
      });
    }

    if (filterDto.accessStatus) {
      query.andWhere('report.accessStatus = :accessStatus', {
        accessStatus: filterDto.accessStatus
      });
    }

    if (filterDto.fiscalYear) {
      query.andWhere('report.fiscalYear = :fiscalYear', {
        fiscalYear: filterDto.fiscalYear
      });
    }

    return query.getMany();
  }

  /**
   * Get reports for a specific client (Client Portal view)
   * Only shows visible reports
   */
  async findByCustomerId(customerId: string): Promise<ClientReport[]> {
    return this.clientReportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.project', 'project')
      .where('report.customerId = :customerId', { customerId })
      .andWhere('report.isVisible = :isVisible', { isVisible: true })
      .orderBy('report.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get a single report by ID
   */
  async findOne(id: string): Promise<ClientReport> {
    const report = await this.clientReportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.customer', 'customer')
      .leftJoinAndSelect('report.project', 'project')
      .where('report.id = :id', { id })
      .getOne();

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  /**
   * Update report details (Admin only)
   */
  async update(
    id: string,
    updateDto: UpdateClientReportDto,
    userId: string
  ): Promise<ClientReport> {
    const report = await this.findOne(id);

    Object.assign(report, updateDto);
    report.updatedBy = userId;

    return this.clientReportRepository.save(report);
  }

  /**
   * Update report access status (Admin only - for controlling download access)
   */
  async updateAccess(
    id: string,
    accessDto: UpdateReportAccessDto,
    userId: string
  ): Promise<ClientReport> {
    const report = await this.findOne(id);

    report.accessStatus = accessDto.accessStatus;
    report.accessNotes = accessDto.accessNotes;
    report.updatedBy = userId;

    if (accessDto.accessStatus === ReportAccessStatus.ACCESSIBLE) {
      report.accessGrantedAt = new Date();
      report.accessGrantedBy = userId;
    }

    return this.clientReportRepository.save(report);
  }

  /**
   * Bulk update access for multiple reports
   */
  async bulkUpdateAccess(
    ids: string[],
    accessStatus: ReportAccessStatus,
    userId: string
  ): Promise<void> {
    const updateData: Partial<ClientReport> = {
      accessStatus,
      updatedBy: userId
    };

    if (accessStatus === ReportAccessStatus.ACCESSIBLE) {
      updateData.accessGrantedAt = new Date();
      updateData.accessGrantedBy = userId;
    }

    await this.clientReportRepository
      .createQueryBuilder()
      .update(ClientReport)
      .set(updateData)
      .whereInIds(ids)
      .execute();
  }

  /**
   * Delete a report (Admin only)
   */
  async remove(id: string): Promise<void> {
    const report = await this.findOne(id);

    // Delete the physical file
    const fullPath = join(process.cwd(), 'public', report.filePath);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }

    await this.clientReportRepository.remove(report);
  }

  /**
   * Check if a client has access to download a specific report
   */
  async canClientDownload(
    reportId: string,
    customerId: string
  ): Promise<{ canDownload: boolean; report: ClientReport; reason?: string }> {
    const report = await this.findOne(reportId);

    if (report.customerId !== customerId) {
      return {
        canDownload: false,
        report,
        reason: 'This report does not belong to your account'
      };
    }

    if (!report.isVisible) {
      return {
        canDownload: false,
        report,
        reason: 'This report is not available'
      };
    }

    if (report.accessStatus !== ReportAccessStatus.ACCESSIBLE) {
      return {
        canDownload: false,
        report,
        reason:
          report.accessStatus === ReportAccessStatus.PENDING
            ? 'Payment pending for this report'
            : 'Access to this report has been revoked'
      };
    }

    return { canDownload: true, report };
  }

  /**
   * Get download statistics for a customer
   */
  async getCustomerStats(customerId: string): Promise<{
    total: number;
    accessible: number;
    pending: number;
  }> {
    const stats = await this.clientReportRepository
      .createQueryBuilder('report')
      .select('report.accessStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('report.customerId = :customerId', { customerId })
      .andWhere('report.isVisible = :isVisible', { isVisible: true })
      .groupBy('report.accessStatus')
      .getRawMany();

    const result = {
      total: 0,
      accessible: 0,
      pending: 0
    };

    stats.forEach((stat) => {
      const count = parseInt(stat.count, 10);
      result.total += count;
      if (stat.status === ReportAccessStatus.ACCESSIBLE) {
        result.accessible = count;
      } else if (stat.status === ReportAccessStatus.PENDING) {
        result.pending = count;
      }
    });

    return result;
  }

  /**
   * Replace file for existing report
   */
  async replaceFile(
    id: string,
    file: Express.Multer.File,
    userId: string
  ): Promise<ClientReport> {
    const report = await this.findOne(id);

    // Delete old file
    const oldFilePath = join(process.cwd(), 'public', report.filePath);
    if (existsSync(oldFilePath)) {
      unlinkSync(oldFilePath);
    }

    // Update with new file
    const newFilePath = file.path.replace(/\\/g, '/').replace('public/', '');
    report.filePath = `/${newFilePath}`;
    report.originalFileName = file.originalname;
    report.fileType = file.mimetype;
    report.fileSize = file.size;
    report.updatedBy = userId;

    return this.clientReportRepository.save(report);
  }

  /**
   * Get projects by customer ID (for report creation dropdown)
   */
  async getProjectsByCustomer(customerId: string): Promise<Project[]> {
    return this.projectRepository.find({
      where: { customer: { id: customerId } },
      select: ['id', 'name', 'status'],
      order: { name: 'ASC' }
    });
  }
}
