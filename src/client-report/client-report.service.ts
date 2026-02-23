import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
import { Customer } from 'src/customers/entities/customer.entity';

@Injectable()
export class ClientReportService {
  constructor(
    @InjectRepository(ClientReport)
    private readonly clientReportRepository: Repository<ClientReport>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>
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

    const { documentTypeId, ...restDto } = createDto;

    const report = this.clientReportRepository.create({
      ...restDto,
      filePath: `/${filePath}`,
      originalFileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      createdBy: userId,
      ...(documentTypeId && { documentType: { id: documentTypeId } })
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
      .leftJoinAndSelect('report.documentType', 'documentType')
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

    if (filterDto.documentTypeId) {
      query.andWhere('report.documentTypeId = :documentTypeId', {
        documentTypeId: filterDto.documentTypeId
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
   * Get reports for a client's customers (Client Portal view)
   * Only shows visible reports across all associated customers
   */
  async findByCustomerIds(customerIds: string[]): Promise<ClientReport[]> {
    return this.clientReportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.project', 'project')
      .leftJoinAndSelect('report.documentType', 'documentType')
      .leftJoinAndSelect('report.customer', 'customer')
      .where('report.customerId IN (:...customerIds)', { customerIds })
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
      .leftJoinAndSelect('report.documentType', 'documentType')
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

    const { documentTypeId, ...restDto } = updateDto;
    
    Object.assign(report, restDto);
    
    // Handle documentType relation separately
    if (documentTypeId !== undefined) {
      report.documentType = documentTypeId ? { id: documentTypeId } as any : null;
    }
    
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
    customerIds: string[]
  ): Promise<{ canDownload: boolean; report: ClientReport; reason?: string }> {
    const report = await this.findOne(reportId);

    if (!customerIds.includes(report.customerId)) {
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

    // Check project payment status if report is linked to a project
    if (report.projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: report.projectId }
      });
      if (project && !this.isPaymentSatisfied(project)) {
        return {
          canDownload: false,
          report,
          reason: 'Payment for the associated project is pending. Documents will be available after payment is confirmed.'
        };
      }
    }

    return { canDownload: true, report };
  }

  /**
   * Get download statistics across all customer accounts
   */
  async getCustomerStats(customerIds: string[]): Promise<{
    total: number;
    accessible: number;
    pending: number;
  }> {
    const stats = await this.clientReportRepository
      .createQueryBuilder('report')
      .select('report.accessStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('report.customerId IN (:...customerIds)', { customerIds })
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

  /**
   * Get projects with details for client portal (all customers)
   */
  async getClientProjects(customerIds: string[]): Promise<any[]> {
    const projects = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.natureOfWork', 'natureOfWork')
      .leftJoinAndSelect('project.customer', 'customer')
      .leftJoin('project.tasks', 'task')
      .addSelect('COUNT(task.id)', 'totalTasks')
      .addSelect(
        "SUM(CASE WHEN task.status = 'done' THEN 1 ELSE 0 END)",
        'completedTasks'
      )
      .where('project.customerId IN (:...customerIds)', { customerIds })
      .groupBy('project.id')
      .addGroupBy('natureOfWork.id')
      .addGroupBy('customer.id')
      .getRawAndEntities();

    return projects.entities.map((project, index) => {
      const raw = projects.raw[index];
      const totalTasks = parseInt(raw.totalTasks || '0', 10);
      const completedTasks = parseInt(raw.completedTasks || '0', 10);
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        natureOfWork: project.natureOfWork?.name || null,
        fiscalYear: project.fiscalYear,
        startingDate: project.startingDate,
        endingDate: project.endingDate,
        isPaymentDone: project.isPaymentDone,
        isPaymentTemporarilyEnabled: project.isPaymentTemporarilyEnabled,
        customerName: (project as any).customer?.name || null,
        customerId: (project as any).customer?.id || null,
        totalTasks,
        completedTasks,
        progress
      };
    });
  }

  /**
   * Get single project details for client portal
   */
  async getClientProjectById(projectId: string, customerIds: string[]): Promise<any> {
    const project = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.natureOfWork', 'natureOfWork')
      .leftJoinAndSelect('project.customer', 'customer')
      .leftJoin('project.tasks', 'task')
      .addSelect('COUNT(task.id)', 'totalTasks')
      .addSelect(
        "SUM(CASE WHEN task.status = 'done' THEN 1 ELSE 0 END)",
        'completedTasks'
      )
      .where('project.id = :projectId', { projectId })
      .andWhere('project.customerId IN (:...customerIds)', { customerIds })
      .groupBy('project.id')
      .addGroupBy('natureOfWork.id')
      .addGroupBy('customer.id')
      .getRawAndEntities();

    if (!project.entities.length) {
      throw new NotFoundException('Project not found');
    }

    const entity = project.entities[0];
    const raw = project.raw[0];
    const totalTasks = parseInt(raw.totalTasks || '0', 10);
    const completedTasks = parseInt(raw.completedTasks || '0', 10);
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get reports count for this project
    const reportStats = await this.clientReportRepository
      .createQueryBuilder('report')
      .select('report.accessStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('report.projectId = :projectId', { projectId })
      .andWhere('report.customerId IN (:...customerIds)', { customerIds })
      .andWhere('report.isVisible = :isVisible', { isVisible: true })
      .groupBy('report.accessStatus')
      .getRawMany();

    const reports = { total: 0, accessible: 0, pending: 0 };
    reportStats.forEach((stat) => {
      const count = parseInt(stat.count, 10);
      reports.total += count;
      if (stat.status === ReportAccessStatus.ACCESSIBLE) {
        reports.accessible = count;
      } else if (stat.status === ReportAccessStatus.PENDING) {
        reports.pending = count;
      }
    });

    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      natureOfWork: entity.natureOfWork?.name || null,
      fiscalYear: entity.fiscalYear,
      startingDate: entity.startingDate,
      endingDate: entity.endingDate,
      isPaymentDone: entity.isPaymentDone,
      isPaymentTemporarilyEnabled: entity.isPaymentTemporarilyEnabled,
      customerName: (entity as any).customer?.name || null,
      customerId: (entity as any).customer?.id || null,
      totalTasks,
      completedTasks,
      progress,
      reports
    };
  }

  /**
   * Get all customer (company) details for client portal
   */
  async getAllCustomerDetails(customerIds: string[]): Promise<any[]> {
    const customers = await this.customerRepository.find({
      where: { id: In(customerIds) },
      relations: ['legalStatus', 'businessSize', 'industryNature']
    });

    const results = [];

    for (const customer of customers) {
      // Get project summary for each customer
      const projectCounts = await this.projectRepository
        .createQueryBuilder('project')
        .select('project.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('project.customerId = :customerId', { customerId: customer.id })
        .groupBy('project.status')
        .getRawMany();

      const projectSummary: Record<string, number> = {};
      let totalProjects = 0;
      projectCounts.forEach((pc) => {
        const count = parseInt(pc.count, 10);
        projectSummary[pc.status] = count;
        totalProjects += count;
      });

      results.push({
        id: customer.id,
        name: customer.name,
        shortName: customer.shortName,
        panNo: customer.panNo,
        registeredDate: customer.registeredDate,
        status: customer.status,
        address: {
          country: customer.country,
          state: customer.state,
          district: customer.district,
          localJurisdiction: customer.localJurisdiction,
          wardNo: customer.wardNo,
          locality: customer.locality
        },
        legalStatus: customer.legalStatus?.name || customer.legalStatusEnum || null,
        businessSize: customer.businessSize?.name || customer.businessSizeEnum || null,
        industryNature: customer.industryNature?.name || customer.industryNatureEnum || null,
        contact: {
          telephoneNo: customer.telephoneNo,
          mobileNo: customer.mobileNo,
          email: customer.email,
          website: customer.website
        },
        projectSummary: {
          total: totalProjects,
          ...projectSummary
        }
      });
    }

    return results;
  }

  /**
   * Check if payment is done or temporarily enabled for a project
   */
  isPaymentSatisfied(project: Project): boolean {
    return project.isPaymentDone || project.isPaymentTemporarilyEnabled;
  }
}
