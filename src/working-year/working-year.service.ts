import { Task } from 'src/tasks/entities/task.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkingYear } from './entities/working-year.entity';
import { WorkingYearConfig } from './entities/working-year-config.entity';
import { CreateWorkingYearDto } from './dto/create-working-year.dto';
import { UpdateWorkingYearDto } from './dto/update-working-year.dto';
import { UpdateWorkingYearConfigDto } from './dto/update-working-year-config.dto';
import { CalendarUtil } from 'src/calendar/calendar.util';
import { Project } from 'src/projects/entities/project.entity';
import { Worklog } from 'src/worklog/entities/worklog.entity';

@Injectable()
export class WorkingYearService implements OnModuleInit {
  constructor(
    @InjectRepository(WorkingYear)
    private readonly workingYearRepository: Repository<WorkingYear>,
    @InjectRepository(WorkingYearConfig)
    private readonly configRepository: Repository<WorkingYearConfig>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Worklog)
    private readonly worklogRepository: Repository<Worklog>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>
  ) {}

  async onModuleInit() {
    try {
      await this.initializeDefaultsAndBackfill();
    } catch (error) {
      console.error('WorkingYearService initialization error:', error);
    }
  }

  /**
   * Helper to calculate Gregorian start and end dates from Nepali BS start year, month, day.
   * By default, a fiscal year begins on nepaliStartYear-nepaliStartMonth-nepaliStartDay
   * and ends 1 day prior to the next year's start date.
   */
  calculateDates(
    startYear: number,
    startMonth: number = 5,
    startDay: number = 1
  ): { startDateAD: Date; endDateAD: Date } {
    const pad = (n: number) => String(n).padStart(2, '0');
    const startBsStr = `${startYear}-${pad(startMonth)}-${pad(startDay)}`;
    const nextStartBsStr = `${startYear + 1}-${pad(startMonth)}-${pad(startDay)}`;

    const startAdStr = CalendarUtil.bsToAd(startBsStr);
    const nextStartAdStr = CalendarUtil.bsToAd(nextStartBsStr);

    const startDateAD = new Date(`${startAdStr}T00:00:00.000Z`);
    const nextStartAD = new Date(`${nextStartAdStr}T00:00:00.000Z`);
    const endDateAD = new Date(nextStartAD.getTime() - 24 * 60 * 60 * 1000);

    return { startDateAD, endDateAD };
  }

  async findAll(): Promise<WorkingYear[]> {
    return this.workingYearRepository.find({
      order: {
        startDateAD: 'DESC'
      }
    });
  }

  async findCurrent(): Promise<WorkingYear> {
    let current = await this.workingYearRepository.findOne({
      where: { isCurrent: true }
    });

    if (!current) {
      const today = new Date();
      const all = await this.findAll();
      current =
        all.find((wy) => {
          const s = new Date(wy.startDateAD);
          const e = new Date(wy.endDateAD);
          return today >= s && today <= e;
        }) || all[0];

      if (current) {
        current.isCurrent = true;
        await this.workingYearRepository.save(current);
      }
    }

    if (!current) {
      throw new NotFoundException('No current working year found');
    }

    return current;
  }

  async findOne(id: string): Promise<WorkingYear> {
    const wy = await this.workingYearRepository.findOne({ where: { id } });
    if (!wy) {
      throw new NotFoundException(`Working year with ID ${id} not found`);
    }
    return wy;
  }

  async create(dto: CreateWorkingYearDto): Promise<WorkingYear> {
    const existing = await this.workingYearRepository.findOne({
      where: { name: dto.name }
    });
    if (existing) {
      throw new BadRequestException(
        `Working year with name "${dto.name}" already exists`
      );
    }

    const month = dto.nepaliStartMonth || 5;
    const day = dto.nepaliStartDay || 1;
    const { startDateAD, endDateAD } = this.calculateDates(
      dto.nepaliStartYear,
      month,
      day
    );

    if (dto.isCurrent) {
      await this.workingYearRepository.update({}, { isCurrent: false });
    }

    const workingYear = this.workingYearRepository.create({
      ...dto,
      nepaliStartMonth: month,
      nepaliStartDay: day,
      startDateAD,
      endDateAD
    });

    return this.workingYearRepository.save(workingYear);
  }

  async update(id: string, dto: UpdateWorkingYearDto): Promise<WorkingYear> {
    const wy = await this.findOne(id);

    if (dto.name && dto.name !== wy.name) {
      const duplicate = await this.workingYearRepository.findOne({
        where: { name: dto.name }
      });
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(
          `Working year with name "${dto.name}" already exists`
        );
      }
      wy.name = dto.name;
    }

    if (dto.nepaliStartYear !== undefined) {
      wy.nepaliStartYear = dto.nepaliStartYear;
    }
    if (dto.nepaliStartMonth !== undefined) {
      wy.nepaliStartMonth = dto.nepaliStartMonth;
    }
    if (dto.nepaliStartDay !== undefined) {
      wy.nepaliStartDay = dto.nepaliStartDay;
    }

    if (
      dto.nepaliStartYear !== undefined ||
      dto.nepaliStartMonth !== undefined ||
      dto.nepaliStartDay !== undefined
    ) {
      const { startDateAD, endDateAD } = this.calculateDates(
        wy.nepaliStartYear,
        wy.nepaliStartMonth,
        wy.nepaliStartDay
      );
      wy.startDateAD = startDateAD;
      wy.endDateAD = endDateAD;
    }

    if (dto.startDateAD) wy.startDateAD = new Date(dto.startDateAD);
    if (dto.endDateAD) wy.endDateAD = new Date(dto.endDateAD);
    if (dto.isActive !== undefined) wy.isActive = dto.isActive;
    if (dto.description !== undefined) wy.description = dto.description;

    if (dto.isCurrent && !wy.isCurrent) {
      await this.workingYearRepository.update({}, { isCurrent: false });
      wy.isCurrent = true;
    } else if (dto.isCurrent !== undefined) {
      wy.isCurrent = dto.isCurrent;
    }

    return this.workingYearRepository.save(wy);
  }

  async setCurrent(id: string): Promise<WorkingYear> {
    const wy = await this.findOne(id);
    await this.workingYearRepository.update({}, { isCurrent: false });
    wy.isCurrent = true;
    wy.isActive = true;
    return this.workingYearRepository.save(wy);
  }

  async remove(id: string): Promise<{ message: string }> {
    const wy = await this.findOne(id);
    const assignedCount = await this.projectRepository.count({
      where: { workingYearId: id }
    });

    if (assignedCount > 0) {
      throw new BadRequestException(
        `Cannot delete working year "${wy.name}" because it is linked to ${assignedCount} project(s).`
      );
    }

    await this.workingYearRepository.remove(wy);
    return { message: `Working year "${wy.name}" deleted successfully` };
  }

  /**
   * System Setting for default Fiscal Year start
   */
  async getConfig(): Promise<WorkingYearConfig> {
    let config = await this.configRepository.findOne();
    if (!config) {
      config = this.configRepository.create({
        defaultStartMonth: 5, // Bhadra
        defaultStartDay: 1,
        description: 'Default Fiscal Year start: Bhadra 1'
      });
      config = await this.configRepository.save(config);
    }
    return config;
  }

  async updateConfig(
    dto: UpdateWorkingYearConfigDto
  ): Promise<WorkingYearConfig> {
    let config = await this.getConfig();
    config.defaultStartMonth = dto.defaultStartMonth;
    config.defaultStartDay = dto.defaultStartDay;
    if (dto.description) config.description = dto.description;
    return this.configRepository.save(config);
  }

  /**
   * Automatically generate the next Working Year from the latest one
   */
  async generateNextWorkingYear(): Promise<WorkingYear> {
    const config = await this.getConfig();
    const all = await this.workingYearRepository.find({
      order: { nepaliStartYear: 'DESC' },
      take: 1
    });

    let nextStartYear = 2082;
    if (all.length > 0) {
      nextStartYear = all[0].nepaliStartYear + 1;
    }

    const nextEndShort = String(nextStartYear + 1).slice(-2);
    const name = `${nextStartYear}/${nextEndShort}`;

    return this.create({
      name,
      nepaliStartYear: nextStartYear,
      nepaliStartMonth: config.defaultStartMonth,
      nepaliStartDay: config.defaultStartDay,
      isCurrent: false,
      isActive: true,
      description: `Fiscal year generated starting from month ${config.defaultStartMonth} day ${config.defaultStartDay}`
    });
  }

  /**
   * Auto seed working years and backfill existing projects if missing
   */
  private async initializeDefaultsAndBackfill() {
    // 1. Ensure Config exists
    await this.getConfig();

    // 2. Check if working years exist
    const count = await this.workingYearRepository.count();
    if (count === 0) {
      console.log('Seeding initial working years (Bhadra 1 default)...');
      // Seed years from 2080 up to 2085
      const years = [2080, 2081, 2082, 2083, 2084];
      const today = new Date();

      for (const y of years) {
        const nextShort = String(y + 1).slice(-2);
        const name = `${y}/${nextShort}`;
        const { startDateAD, endDateAD } = this.calculateDates(y, 5, 1);
        const isCurrent = today >= startDateAD && today <= endDateAD;

        const wy = this.workingYearRepository.create({
          name,
          nepaliStartYear: y,
          nepaliStartMonth: 5,
          nepaliStartDay: 1,
          startDateAD,
          endDateAD,
          isCurrent,
          isActive: true,
          description: `Fiscal Year ${name} (Bhadra 1 - Shrawan end)`
        });
        await this.workingYearRepository.save(wy);
      }

      // If no year matched today as current, set the latest as current
      const currentExists = await this.workingYearRepository.findOne({
        where: { isCurrent: true }
      });
      if (!currentExists) {
        const latest = await this.workingYearRepository.findOne({
          order: { nepaliStartYear: 'DESC' }
        });
        if (latest) {
          latest.isCurrent = true;
          await this.workingYearRepository.save(latest);
        }
      }
    }

    // 3. Backfill workingYearId on projects that don't have one
    const workingYears = await this.workingYearRepository.find();
    if (workingYears.length > 0) {
      const projectsWithoutWY = await this.projectRepository
        .createQueryBuilder('project')
        .where('project.workingYearId IS NULL')
        .getMany();

      if (projectsWithoutWY.length > 0) {
        console.log(
          `Backfilling workingYear on ${projectsWithoutWY.length} projects...`
        );
        for (const proj of projectsWithoutWY) {
          // 1st preference: match by proj.createdAt or startingDate (created date determines working year)
          let matchedWY = null;
          const checkDate = proj.createdAt
            ? new Date(proj.createdAt)
            : proj.startingDate
            ? new Date(proj.startingDate)
            : null;
          if (checkDate) {
            matchedWY = workingYears.find((wy) => {
              const s = new Date(wy.startDateAD);
              const e = new Date(wy.endDateAD);
              return checkDate >= s && checkDate <= e;
            });
          }

          // 2nd preference: match by proj.fiscalYear
          if (!matchedWY && proj.fiscalYear) {
            matchedWY = workingYears.find(
              (wy) => wy.nepaliStartYear === proj.fiscalYear
            );
          }

          // Fallback: current working year
          if (!matchedWY) {
            matchedWY =
              workingYears.find((wy) => wy.isCurrent) || workingYears[0];
          }

          if (matchedWY) {
            await this.projectRepository.query(
              `UPDATE project SET "workingYearId" = $1 WHERE id = $2`,
              [matchedWY.id, proj.id]
            );
          }
        }
      }
    }

    // 4. Backfill project.firstWorklogAt for projects where it's null
    try {
      const projectsWithoutFirstWorklog = await this.projectRepository
        .createQueryBuilder('project')
        .where('project.firstWorklogAt IS NULL')
        .getMany();

      if (projectsWithoutFirstWorklog.length > 0) {
        for (const p of projectsWithoutFirstWorklog) {
          const earliestWorklog = await this.worklogRepository
            .createQueryBuilder('worklog')
            .where('worklog.projectId = :projectId', { projectId: p.id })
            .orderBy('worklog.startTime', 'ASC')
            .addOrderBy('worklog.createdAt', 'ASC')
            .getOne();

          if (earliestWorklog) {
            const firstWlDate = earliestWorklog.startTime || earliestWorklog.createdAt;
            await this.projectRepository.query(
              `UPDATE project SET "firstWorklogAt" = $1 WHERE id = $2`,
              [firstWlDate, p.id]
            );
          }
        }
      }
    } catch (e) {
      console.warn('Could not backfill firstWorklogAt:', e.message);
    }

    // 5. Backfill completedAt & completedInWorkingYear for completed projects
    try {
      const completedWithoutDate = await this.projectRepository
        .createQueryBuilder('project')
        .where("project.status = 'completed'")
        .andWhere('project.completedAt IS NULL')
        .getMany();

      if (completedWithoutDate.length > 0) {
        for (const cp of completedWithoutDate) {
          const lastTaskDone = await this.taskRepository
            .createQueryBuilder('task')
            .where('task.projectId = :projectId', { projectId: cp.id })
            .andWhere("task.status = 'done'")
            .orderBy('task.updatedAt', 'DESC')
            .getOne();

          const lastWl = await this.worklogRepository
            .createQueryBuilder('worklog')
            .where('worklog.projectId = :projectId', { projectId: cp.id })
            .orderBy('worklog.startTime', 'DESC')
            .addOrderBy('worklog.createdAt', 'DESC')
            .getOne();

          let compDate: Date = null;
          if (lastTaskDone?.updatedAt && lastWl?.startTime) {
            compDate = new Date(lastTaskDone.updatedAt) > new Date(lastWl.startTime)
              ? lastTaskDone.updatedAt
              : lastWl.startTime;
          } else if (lastTaskDone?.updatedAt) {
            compDate = lastTaskDone.updatedAt;
          } else if (lastWl?.startTime) {
            compDate = lastWl.startTime;
          } else {
            compDate = cp.endingDate ? new Date(cp.endingDate) : (cp.createdAt ? new Date(cp.createdAt) : new Date());
          }

          const matchedWY = workingYears.find((wy) => {
            const s = new Date(wy.startDateAD);
            const e = new Date(wy.endDateAD);
            return compDate >= s && compDate <= e;
          });
          await this.projectRepository.query(
            `UPDATE project SET "completedAt" = $1, "completedInWorkingYearId" = $2 WHERE id = $3`,
            [compDate, matchedWY?.id || null, cp.id]
          );
        }
      }
    } catch (e) {
      console.warn('Could not backfill completedAt:', e.message);
    }
  }


}
