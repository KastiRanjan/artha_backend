import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { RecurringProject, RecurrenceFrequency } from './entities/recurring-project.entity';
import { CreateRecurringProjectDto, UpdateRecurringProjectDto } from './dto/recurring-project.dto';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Injectable()
export class RecurringProjectsService {
  private readonly logger = new Logger(RecurringProjectsService.name);

  constructor(
    @InjectRepository(RecurringProject)
    private recurringRepo: Repository<RecurringProject>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    private readonly projectsService: ProjectsService
  ) {}

  async findByCustomer(customerId: string) {
    return this.recurringRepo.find({
      where: { customerId },
      relations: ['natureOfWork'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateRecurringProjectDto, user?: UserEntity) {
    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Client with ID ${dto.customerId} not found`);
    }

    const schedule = this.recurringRepo.create({
      namePattern: dto.namePattern.trim(),
      description: dto.description?.trim() || `${dto.namePattern.trim()} (Recurring engagement)`,
      customerId: dto.customerId,
      natureOfWorkId: dto.natureOfWorkId,
      natureOfWorkGroupId: dto.natureOfWorkGroupId || null,
      frequency: dto.frequency,
      nextRunDate: new Date(dto.nextRunDate),
      durationDays: dto.durationDays ?? 30,
      projectLeadId: dto.projectLeadId || null,
      projectManagerId: dto.projectManagerId || null,
      userIds: Array.isArray(dto.userIds) ? dto.userIds : [],
      workingYearId: dto.workingYearId || null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
    });

    return this.recurringRepo.save(schedule);
  }

  async update(id: string, dto: UpdateRecurringProjectDto, user?: UserEntity) {
    const schedule = await this.recurringRepo.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Recurring schedule ${id} not found`);
    }

    if (dto.namePattern !== undefined) schedule.namePattern = dto.namePattern.trim();
    if (dto.description !== undefined) schedule.description = dto.description?.trim() || null;
    if (dto.natureOfWorkId !== undefined) schedule.natureOfWorkId = dto.natureOfWorkId;
    if (dto.natureOfWorkGroupId !== undefined) schedule.natureOfWorkGroupId = dto.natureOfWorkGroupId || null;
    if (dto.frequency !== undefined) schedule.frequency = dto.frequency;
    if (dto.nextRunDate !== undefined) schedule.nextRunDate = new Date(dto.nextRunDate);
    if (dto.durationDays !== undefined) schedule.durationDays = dto.durationDays;
    if (dto.projectLeadId !== undefined) schedule.projectLeadId = dto.projectLeadId || null;
    if (dto.projectManagerId !== undefined) schedule.projectManagerId = dto.projectManagerId || null;
    if (dto.userIds !== undefined) schedule.userIds = dto.userIds;
    if (dto.workingYearId !== undefined) schedule.workingYearId = dto.workingYearId || null;
    if (dto.isActive !== undefined) schedule.isActive = dto.isActive;
    if (user?.id) schedule.updatedBy = user.id;

    return this.recurringRepo.save(schedule);
  }

  async remove(id: string) {
    const schedule = await this.recurringRepo.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Recurring schedule ${id} not found`);
    }
    await this.recurringRepo.remove(schedule);
    return { id };
  }

  private computeNextRunDate(current: Date, frequency: RecurrenceFrequency): Date {
    const next = new Date(current);
    switch (frequency) {
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'semi_annual':
        next.setMonth(next.getMonth() + 6);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }

  private async resolveUniqueProjectName(
    schedule: RecurringProject,
    runDate: Date
  ): Promise<string> {
    const customer = await this.customerRepo.findOne({
      where: { id: schedule.customerId },
      select: ['id', 'shortName', 'name'],
    });
    const shortName =
      customer?.shortName ||
      (customer?.name ? customer.name.slice(0, 8).toUpperCase() : 'CLIENT');

    const year = runDate.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[runDate.getMonth()];
    const quarter = `Q${Math.floor(runDate.getMonth() / 3) + 1}`;
    const period =
      schedule.frequency === 'monthly'
        ? `${month}-${year}`
        : schedule.frequency === 'quarterly'
        ? `${quarter}-${year}`
        : `${year}`;

    let baseName = schedule.namePattern
      .replace(/\{SHORT_NAME\}/gi, shortName)
      .replace(/\{YEAR\}/gi, String(year))
      .replace(/\{MONTH\}/gi, month)
      .replace(/\{PERIOD\}/gi, period);

    if (baseName === schedule.namePattern && !baseName.includes(period)) {
      baseName = `${baseName} (${period})`;
    }

    baseName = baseName.slice(0, 92);

    let candidate = baseName;
    let suffix = 2;
    while (await this.projectRepo.findOne({ where: { name: candidate } })) {
      candidate = `${baseName}-${suffix}`.slice(0, 100);
      suffix++;
    }

    return candidate;
  }

  async triggerNow(id: string, user?: UserEntity) {
    const schedule = await this.recurringRepo.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Recurring schedule ${id} not found`);
    }

    const startDate = new Date(schedule.nextRunDate || new Date());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (schedule.durationDays || 30));

    const projectName = await this.resolveUniqueProjectName(schedule, startDate);

    const createdProject = await this.projectsService.create(
      {
        name: projectName,
        description:
          schedule.description ||
          `Auto-generated recurring engagement (${schedule.frequency})`,
        status: 'active',
        natureOfWork: schedule.natureOfWorkId,
        natureOfWorkGroup: schedule.natureOfWorkGroupId || undefined,
        startingDate: startDate,
        endingDate: endDate,
        customer: schedule.customerId,
        projectLead: schedule.projectLeadId || undefined,
        projectManager: schedule.projectManagerId || undefined,
        users: schedule.userIds || [],
        workingYearId: schedule.workingYearId || undefined,
      } as any,
      user
    );

    schedule.lastRunAt = new Date();
    schedule.lastCreatedProjectId = createdProject.id;
    schedule.nextRunDate = this.computeNextRunDate(startDate, schedule.frequency);
    await this.recurringRepo.save(schedule);

    return {
      project: createdProject,
      schedule,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async processDueRecurringProjects() {
    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const dueSchedules = await this.recurringRepo.find({
        where: {
          isActive: true,
          nextRunDate: LessThanOrEqual(today),
        },
      });

      for (const schedule of dueSchedules) {
        try {
          await this.triggerNow(schedule.id);
          this.logger.log(`Auto-created recurring project for schedule ${schedule.id}`);
        } catch (err) {
          this.logger.error(
            `Failed to auto-create project for recurring schedule ${schedule.id}: ${err.message}`
          );
        }
      }
    } catch (err) {
      this.logger.error(`Recurring projects cron failed: ${err.message}`);
    }
  }
}
