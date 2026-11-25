import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual, Between } from 'typeorm';
import { Project } from 'src/projects/entities/project.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { NoticeBoard } from 'src/notice-board/entities/notice-board.entity';
import { WorkingYear } from 'src/working-year/entities/working-year.entity';
import { ClientReport } from 'src/client-report/entities/client-report.entity';
import { ClientUser } from 'src/client-report/entities/client-user.entity';
import moment = require('moment');

import { UserStatusEnum } from 'src/auth/user-status.enum';
import { AuthService } from 'src/auth/auth.service';
import { UsersStatsInterface } from 'src/dashboard/interface/user-stats.interface';
import { BrowserStatsInterface } from 'src/dashboard/interface/browser-stats.interface';
import { OsStatsInterface } from 'src/dashboard/interface/os-stats.interface';
import { AttendenceService } from 'src/attendence/attendence.service';
import { UserEntity } from 'src/auth/entity/user.entity';
import { WorklogService } from 'src/worklog/worklog.service';
import { WorkhourService } from 'src/workhour/workhour.service';
import { Attendance } from 'src/attendence/entities/attendence.entity';

@Injectable()
export class DashboardService {
  constructor(
    private readonly authService: AuthService,
    private readonly attendenceService: AttendenceService,
    private readonly worklogService: WorklogService,
    private readonly workhourService: WorkhourService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(NoticeBoard)
    private readonly noticeRepository: Repository<NoticeBoard>,
    @InjectRepository(WorkingYear)
    private readonly workingYearRepository: Repository<WorkingYear>,
    @InjectRepository(ClientReport)
    private readonly clientReportRepository: Repository<ClientReport>,
    @InjectRepository(ClientUser)
    private readonly clientUserRepository: Repository<ClientUser>
  ) {}

  async getUserStat(): Promise<UsersStatsInterface> {
    const totalUserPromise = this.authService.countByCondition({});
    const totalActiveUserPromise = this.authService.countByCondition({
      status: UserStatusEnum.ACTIVE
    });
    const totalInActiveUserPromise = this.authService.countByCondition({
      status: UserStatusEnum.INACTIVE
    });
    const [total, active, inactive] = await Promise.all([
      totalUserPromise,
      totalActiveUserPromise,
      totalInActiveUserPromise
    ]);
    return {
      total,
      active,
      inactive
    };
  }

  getOsData(): Promise<Array<OsStatsInterface>> {
    return this.authService.getRefreshTokenGroupedData('os');
  }

  getBrowserData(): Promise<Array<BrowserStatsInterface>> {
    return this.authService.getRefreshTokenGroupedData('browser');
  }

  async getAttendanceStats(user: UserEntity, date?: string) {
    return this.attendenceService.getDashboardAttendanceStats(user, date);
  }

  async getWorkingTimeStats(user: UserEntity, date?: string, period: 'day' | 'week' | 'month' = 'day') {
    // Determine date range based on period
    let startDate: Date;
    let endDate: Date;
    const targetDate = date ? moment(date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');

    if (period === 'day') {
      startDate = moment(targetDate).startOf('day').toDate();
      endDate = moment(targetDate).endOf('day').toDate();
    } else if (period === 'week') {
      startDate = moment(targetDate).startOf('week').toDate();
      endDate = moment(targetDate).endOf('week').toDate();
    } else {
      startDate = moment(targetDate).startOf('month').toDate();
      endDate = moment(targetDate).endOf('month').toDate();
    }

    // Get only active users with role relation (exclude inactive and blocked)
    const allUsers = await this.userRepository.find({
      where: { status: UserStatusEnum.ACTIVE },
      relations: ['role']
    });

    const startDateStr = moment(startDate).format('YYYY-MM-DD');
    const endDateStr = moment(endDate).format('YYYY-MM-DD');
    
    // Dates in range
    const currentDate = moment(startDate);
    const dates: string[] = [];
    while (currentDate.isSameOrBefore(moment(endDate), 'day')) {
      dates.push(currentDate.format('YYYY-MM-DD'));
      currentDate.add(1, 'day');
    }

    // High-performance bulk fetch: resolve workhours in 1 query, worklog aggregate, and attendance records in parallel
    const [allWorkhours, worklogRows, attendanceRecords] = await Promise.all([
      this.workhourService.findAll().catch(() => []),
      this.worklogService.getAggregatedMinutesForPeriod(startDate, endDate),
      this.attendanceRepository.find({
        where: {
          date: Between(startDateStr, endDateStr)
        },
        select: ['id', 'userId', 'date', 'clockIn', 'clockOut']
      })
    ]);

    // Build fast lookup maps
    const workhourByRole = new Map<string, any>();
    allWorkhours.forEach((wh: any) => {
      if (wh.roleId && !workhourByRole.has(wh.roleId)) {
        workhourByRole.set(wh.roleId, wh);
      }
    });
    const roleWorkhourMap = new Map<string, any>();
    allUsers.forEach((u) => {
      roleWorkhourMap.set(u.id, workhourByRole.get(u.roleId) || { workHours: 8 });
    });

    const worklogMap = new Map<string, number>();
    for (const r of worklogRows) {
      const uId = r.userId;
      const dStr = r.date;
      const mins = Number(r.minutes || 0);
      worklogMap.set(`${uId}_${dStr}`, mins);
    }

    const attendanceMap = new Map<string, number>();
    for (const a of attendanceRecords) {
      if (a.userId && a.date && a.clockIn && a.clockOut) {
        const clockIn = moment(a.clockIn, 'HH:mm:ss');
        const clockOut = moment(a.clockOut, 'HH:mm:ss');
        const mins = Math.max(0, clockOut.diff(clockIn, 'minutes'));
        attendanceMap.set(`${a.userId}_${a.date}`, mins);
      }
    }

    const userStatsMap = new Map();

    for (const dbUser of allUsers) {
      let totalWorklogMinutes = 0;
      let totalAttendanceMinutes = 0;
      let daysWithWorklog = 0;
      let daysWithAttendance = 0;
      let overtimeDays = 0;
      let worklogExceedsAttendanceDays = 0;

      const roleWorkhour = roleWorkhourMap.get(dbUser.id) || { workHours: 8 };
      const expectedDailyMinutes = (roleWorkhour.workHours || 8) * 60;

      for (const dateStr of dates) {
        const dailyWorklogMinutes = worklogMap.get(`${dbUser.id}_${dateStr}`) || 0;
        const dailyAttendanceMinutes = attendanceMap.get(`${dbUser.id}_${dateStr}`) || 0;

        if (dailyWorklogMinutes > 0) {
          daysWithWorklog++;
          totalWorklogMinutes += dailyWorklogMinutes;

          if (dailyWorklogMinutes > expectedDailyMinutes) {
            overtimeDays++;
          }
        }

        if (dailyAttendanceMinutes > 0) {
          daysWithAttendance++;
          totalAttendanceMinutes += dailyAttendanceMinutes;
        }

        if (dailyWorklogMinutes > 0 && dailyAttendanceMinutes > 0 && dailyWorklogMinutes > dailyAttendanceMinutes) {
          worklogExceedsAttendanceDays++;
        }
      }

      userStatsMap.set(dbUser.id, {
        userId: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        roleName: dbUser.role?.name || 'N/A',
        roleId: dbUser.roleId,
        expectedDailyMinutes,
        expectedDailyHours: roleWorkhour.workHours || 8,
        totalWorklogMinutes,
        totalAttendanceMinutes,
        daysWithWorklog,
        daysWithAttendance,
        overtimeDays,
        worklogExceedsAttendanceDays,
        averageWorklogMinutesPerDay: daysWithWorklog > 0 ? Math.round(totalWorklogMinutes / daysWithWorklog) : 0,
        averageAttendanceMinutesPerDay: daysWithAttendance > 0 ? Math.round(totalAttendanceMinutes / daysWithAttendance) : 0
      });
    }

    const userStats = Array.from(userStatsMap.values());

    // Calculate summary statistics
    const summary = {
      totalUsers: allUsers.length,
      usersWithWorklog: userStats.filter(u => u.totalWorklogMinutes > 0).length,
      usersWithoutWorklog: userStats.filter(u => u.totalWorklogMinutes === 0).length,
      usersWithOvertime: userStats.filter(u => u.overtimeDays > 0).length,
      usersWorklogExceedsAttendance: userStats.filter(u => u.worklogExceedsAttendanceDays > 0).length,
      totalWorklogHours: Math.round(userStats.reduce((sum, u) => sum + u.totalWorklogMinutes, 0) / 60 * 10) / 10,
      totalAttendanceHours: Math.round(userStats.reduce((sum, u) => sum + u.totalAttendanceMinutes, 0) / 60 * 10) / 10,
      averageWorklogHoursPerUser: userStats.length > 0 ? Math.round(userStats.reduce((sum, u) => sum + u.totalWorklogMinutes, 0) / userStats.length / 60 * 10) / 10 : 0,
      period,
      startDate: moment(startDate).format('YYYY-MM-DD'),
      endDate: moment(endDate).format('YYYY-MM-DD'),
      totalDays: dates.length
    };

    // Group users by categories
    const usersWithoutWorklog = userStats.filter(u => u.totalWorklogMinutes === 0);
    const usersWithOvertime = userStats.filter(u => u.overtimeDays > 0).sort((a, b) => b.overtimeDays - a.overtimeDays);
    const usersWorklogExceedsAttendance = userStats.filter(u => u.worklogExceedsAttendanceDays > 0).sort((a, b) => b.worklogExceedsAttendanceDays - a.worklogExceedsAttendanceDays);
    const topPerformers = userStats.filter(u => u.totalWorklogMinutes > 0).sort((a, b) => b.totalWorklogMinutes - a.totalWorklogMinutes).slice(0, 10);
    const underPerformers = userStats.filter(u => u.totalWorklogMinutes > 0 && u.totalWorklogMinutes < u.expectedDailyMinutes * dates.length * 0.8).sort((a, b) => a.totalWorklogMinutes - b.totalWorklogMinutes).slice(0, 10);

    return {
      summary,
      userStats,
      usersWithoutWorklog,
      usersWithOvertime,
      usersWorklogExceedsAttendance,
      topPerformers,
      underPerformers,
      date: targetDate,
      period
    };
  }

  async getSidebarSummary(user: UserEntity, workingYearId?: string) {
    const oneMonthAgo = moment().subtract(30, 'days').startOf('day').toDate();
    const oneWeekAgo = moment().subtract(7, 'days').startOf('day').toDate();

    let targetWY: WorkingYear = null;
    if (workingYearId && workingYearId !== 'all') {
      targetWY = await this.workingYearRepository.findOne({ where: { id: workingYearId } });
    }
    if (!targetWY && (!workingYearId || workingYearId !== 'all')) {
      targetWY = await this.workingYearRepository.findOne({ where: { isCurrent: true } });
    }

    const isSuperAdmin = user?.role?.name === 'superuser' || user?.role?.name === 'administrator';

    let accessibleProjectIds: string[] = [];
    let accessibleCustomerIds: string[] = [];

    if (!isSuperAdmin && user?.id) {
      const accessibleRows = await this.projectRepository
        .createQueryBuilder('p')
        .select('DISTINCT p.id', 'id')
        .addSelect('p.customerId', 'customerId')
        .leftJoin('p.users', 'pu')
        .where(
          '(pu.id = :userId OR p.projectLeadId = :userId OR p.projectManagerId = :userId OR p.createdBy = :userIdText)',
          { userId: user.id, userIdText: String(user.id) }
        )
        .getRawMany();

      accessibleProjectIds = accessibleRows.map((r) => r.id).filter(Boolean);
      accessibleCustomerIds = Array.from(new Set(accessibleRows.map((r) => r.customerId).filter(Boolean)));
    }

    // Ultra-fast single-pass parallel queries for counts and recent items (<50ms total)
    let projectCountsPromise: Promise<{ recent: number; weekly: number; total: number }>;
    let clientCountsPromise: Promise<{ recent: number; weekly: number; total: number }>;
    let userCountsPromise: Promise<{ recent: number; weekly: number; total: number }>;
    let reportCountsPromise: Promise<{ recent: number; weekly: number; total: number }>;
    let clientUserCountsPromise: Promise<{ recent: number; weekly: number; total: number }>;

    if (isSuperAdmin) {
      projectCountsPromise = this.projectRepository.query(
        `SELECT 
          COUNT(*) FILTER (WHERE "createdAt" >= $1 OR "updatedAt" >= $1) as recent,
          COUNT(*) FILTER (WHERE "createdAt" >= $2 OR "updatedAt" >= $2) as weekly,
          COUNT(*) FILTER (WHERE status = 'active' AND ($3::uuid IS NULL OR "workingYearId" = $3::uuid OR ("workingYearId" IS NOT NULL AND "completedAt" IS NULL))) as total
        FROM project`,
        [oneMonthAgo, oneWeekAgo, targetWY?.id || null]
      ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), total: Number(r[0]?.total || 0) })).catch(() => ({ recent: 0, weekly: 0, total: 0 }));

      clientCountsPromise = this.customerRepository.query(
        `SELECT 
          COUNT(*) FILTER (WHERE "createdAt" >= $1 OR "updatedAt" >= $1) as recent,
          COUNT(*) FILTER (WHERE "createdAt" >= $2 OR "updatedAt" >= $2) as weekly,
          COUNT(*) FILTER (WHERE status = 'active') as total
        FROM customer`,
        [oneMonthAgo, oneWeekAgo]
      ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), total: Number(r[0]?.total || 0) })).catch(() => ({ recent: 0, weekly: 0, total: 0 }));

      userCountsPromise = this.userRepository.query(
        `SELECT 
          COUNT(*) FILTER (WHERE "createdAt" >= $1 OR "updatedAt" >= $1) as recent,
          COUNT(*) FILTER (WHERE "createdAt" >= $2 OR "updatedAt" >= $2) as weekly,
          COUNT(*) FILTER (WHERE status = 'active') as total
        FROM "user"`,
        [oneMonthAgo, oneWeekAgo]
      ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), total: Number(r[0]?.total || 0) })).catch(() => ({ recent: 0, weekly: 0, total: 0 }));

      reportCountsPromise = this.clientReportRepository.query(
        `SELECT 
          COUNT(*) FILTER (WHERE "createdAt" >= $1 OR "updatedAt" >= $1) as recent,
          COUNT(*) FILTER (WHERE "createdAt" >= $2 OR "updatedAt" >= $2) as weekly,
          COUNT(*) as total
        FROM client_report`,
        [oneMonthAgo, oneWeekAgo]
      ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), total: Number(r[0]?.total || 0) })).catch(() => ({ recent: 0, weekly: 0, total: 0 }));

      clientUserCountsPromise = this.clientUserRepository.query(
        `SELECT 
          COUNT(*) FILTER (WHERE "createdAt" >= $1 OR "updatedAt" >= $1) as recent,
          COUNT(*) FILTER (WHERE "createdAt" >= $2 OR "updatedAt" >= $2) as weekly,
          COUNT(*) as total
        FROM client_user`,
        [oneMonthAgo, oneWeekAgo]
      ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), total: Number(r[0]?.total || 0) })).catch(() => ({ recent: 0, weekly: 0, total: 0 }));
    } else {
      projectCountsPromise = accessibleProjectIds.length === 0
        ? Promise.resolve({ recent: 0, weekly: 0, total: 0 })
        : this.projectRepository.query(
            `SELECT 
              COUNT(*) FILTER (WHERE "createdAt" >= $1 OR "updatedAt" >= $1) as recent,
              COUNT(*) FILTER (WHERE "createdAt" >= $2 OR "updatedAt" >= $2) as weekly,
              COUNT(*) FILTER (WHERE status = 'active' AND ($3::uuid IS NULL OR "workingYearId" = $3::uuid OR ("workingYearId" IS NOT NULL AND "completedAt" IS NULL))) as total
            FROM project
            WHERE id = ANY($4::uuid[])`,
            [oneMonthAgo, oneWeekAgo, targetWY?.id || null, accessibleProjectIds]
          ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), total: Number(r[0]?.total || 0) })).catch(() => ({ recent: 0, weekly: 0, total: 0 }));

      clientCountsPromise = accessibleCustomerIds.length === 0
        ? Promise.resolve({ recent: 0, weekly: 0, total: 0 })
        : this.customerRepository.query(
            `SELECT 
              COUNT(*) FILTER (WHERE "createdAt" >= $1 OR "updatedAt" >= $1) as recent,
              COUNT(*) FILTER (WHERE "createdAt" >= $2 OR "updatedAt" >= $2) as weekly,
              COUNT(*) FILTER (WHERE status = 'active') as total
            FROM customer
            WHERE id = ANY($3::uuid[])`,
            [oneMonthAgo, oneWeekAgo, accessibleCustomerIds]
          ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), total: Number(r[0]?.total || 0) })).catch(() => ({ recent: 0, weekly: 0, total: 0 }));

      userCountsPromise = Promise.resolve({ recent: 0, weekly: 0, total: 0 });

      reportCountsPromise = accessibleCustomerIds.length === 0
        ? Promise.resolve({ recent: 0, weekly: 0, total: 0 })
        : this.clientReportRepository.query(
            `SELECT 
              COUNT(*) FILTER (WHERE "createdAt" >= $1 OR "updatedAt" >= $1) as recent,
              COUNT(*) FILTER (WHERE "createdAt" >= $2 OR "updatedAt" >= $2) as weekly,
              COUNT(*) as total
            FROM client_report
            WHERE "customerId" = ANY($3::uuid[])`,
            [oneMonthAgo, oneWeekAgo, accessibleCustomerIds]
          ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), total: Number(r[0]?.total || 0) })).catch(() => ({ recent: 0, weekly: 0, total: 0 }));

      clientUserCountsPromise = accessibleCustomerIds.length === 0
        ? Promise.resolve({ recent: 0, weekly: 0, total: 0 })
        : this.clientUserRepository.query(
            `SELECT 
              COUNT(DISTINCT cu.id) FILTER (WHERE cu."createdAt" >= $1 OR cu."updatedAt" >= $1) as recent,
              COUNT(DISTINCT cu.id) FILTER (WHERE cu."createdAt" >= $2 OR cu."updatedAt" >= $2) as weekly,
              COUNT(DISTINCT cu.id) as total
            FROM client_user cu
            INNER JOIN client_user_customers cuc ON cuc."clientUserId" = cu.id
            WHERE cuc."customerId" = ANY($3::uuid[])`,
            [oneMonthAgo, oneWeekAgo, accessibleCustomerIds]
          ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), total: Number(r[0]?.total || 0) })).catch(() => ({ recent: 0, weekly: 0, total: 0 }));
    }

    const taskCountsPromise = this.taskRepository.query(
      `SELECT 
        COUNT(*) FILTER (WHERE t."createdAt" >= $1 OR t."updatedAt" >= $1) as recent,
        COUNT(*) FILTER (WHERE t."createdAt" >= $2 OR t."updatedAt" >= $2) as weekly,
        COUNT(*) FILTER (WHERE t.status != 'done') as pending
      FROM task t
      INNER JOIN task_user tu ON tu."taskId" = t.id
      WHERE tu."userId" = $3`,
      [oneMonthAgo, oneWeekAgo, user?.id]
    ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), pending: Number(r[0]?.pending || 0) })).catch(() => ({ recent: 0, weekly: 0, pending: 0 }));

    const noticeCountsPromise = this.noticeRepository.query(
      `SELECT 
        COUNT(*) FILTER (WHERE "createdAt" >= $1 OR "updatedAt" >= $1) as recent,
        COUNT(*) FILTER (WHERE "createdAt" >= $2 OR "updatedAt" >= $2) as weekly,
        COUNT(*) as total
      FROM notice_board`,
      [oneMonthAgo, oneWeekAgo]
    ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), total: Number(r[0]?.total || 0) })).catch(() => ({ recent: 0, weekly: 0, total: 0 }));

    const phonebookCountsPromise = this.userRepository.query(
      `SELECT 
        COUNT(*) FILTER (WHERE "createdAt" >= $1 OR "updatedAt" >= $1) as recent,
        COUNT(*) FILTER (WHERE "createdAt" >= $2 OR "updatedAt" >= $2) as weekly,
        COUNT(*) as total
      FROM phonebook_entries`,
      [oneMonthAgo, oneWeekAgo]
    ).then(r => ({ recent: Number(r[0]?.recent || 0), weekly: Number(r[0]?.weekly || 0), total: Number(r[0]?.total || 0) })).catch(() => ({ recent: 0, weekly: 0, total: 0 }));

    const [
      projectCounts,
      clientCounts,
      userCounts,
      reportCounts,
      clientUserCounts,
      taskCounts,
      noticeCounts,
      phonebookCounts,
      recentProjectsRaw,
      recentClientsRaw,
      recentUsersRaw,
      recentClientReportsRaw,
      recentClientUsersRaw,
      recentTasksRaw,
      recentNoticesRaw,
      recentPhonebookRaw,
      recentUpdatedProjectsRaw,
      recentUpdatedClientsRaw,
      recentUpdatedUsersRaw,
      recentUpdatedClientReportsRaw,
      recentUpdatedClientUsersRaw,
      recentUpdatedTasksRaw,
      recentUpdatedNoticesRaw,
      recentUpdatedPhonebookRaw
    ] = await Promise.all([
      projectCountsPromise,
      clientCountsPromise,
      userCountsPromise,
      reportCountsPromise,
      clientUserCountsPromise,
      taskCountsPromise,
      noticeCountsPromise,
      phonebookCountsPromise,

      // 8. Recent 5 Projects
      !isSuperAdmin && accessibleProjectIds.length === 0
        ? Promise.resolve([])
        : this.projectRepository.find({
            where: isSuperAdmin
              ? { createdAt: MoreThanOrEqual(oneMonthAgo) }
              : { id: In(accessibleProjectIds), createdAt: MoreThanOrEqual(oneMonthAgo) },
            order: { createdAt: 'DESC' },
            take: 5,
            select: ['id', 'name', 'status', 'createdAt', 'createdBy']
          }).catch(() => []),

      // 9. Recent 5 Clients
      !isSuperAdmin && accessibleCustomerIds.length === 0
        ? Promise.resolve([])
        : this.customerRepository.find({
            where: isSuperAdmin
              ? { createdAt: MoreThanOrEqual(oneMonthAgo) }
              : { id: In(accessibleCustomerIds), createdAt: MoreThanOrEqual(oneMonthAgo) },
            order: { createdAt: 'DESC' },
            take: 5,
            select: ['id', 'name', 'status', 'createdAt', 'createdBy']
          }).catch(() => []),

      // 10. Recent 5 Users
      isSuperAdmin
        ? this.userRepository.find({
            where: { createdAt: MoreThanOrEqual(oneMonthAgo) },
            order: { createdAt: 'DESC' },
            take: 5,
            select: ['id', 'name', 'status', 'createdAt', 'avatar', 'createdBy']
          }).catch(() => [])
        : Promise.resolve([]),

      // 11. Recent 5 Client Reports
      !isSuperAdmin && accessibleCustomerIds.length === 0
        ? Promise.resolve([])
        : this.clientReportRepository
            .find({
              where: isSuperAdmin
                ? { createdAt: MoreThanOrEqual(oneMonthAgo) }
                : { customerId: In(accessibleCustomerIds), createdAt: MoreThanOrEqual(oneMonthAgo) },
              order: { createdAt: 'DESC' },
              take: 5,
              relations: ['customer', 'documentType']
            })
            .catch(() => []),

      // 12. Recent 5 Client Users
      !isSuperAdmin && accessibleCustomerIds.length === 0
        ? Promise.resolve([])
        : !isSuperAdmin
        ? this.clientUserRepository
            .createQueryBuilder('cu')
            .innerJoinAndSelect('cu.customers', 'c', 'c.id IN (:...accessibleCustomerIds)', { accessibleCustomerIds })
            .where('cu.createdAt >= :oneMonthAgo', { oneMonthAgo })
            .orderBy('cu.createdAt', 'DESC')
            .take(5)
            .getMany()
            .catch(() => [])
        : this.clientUserRepository
            .find({
              where: { createdAt: MoreThanOrEqual(oneMonthAgo) },
              order: { createdAt: 'DESC' },
              take: 5,
              relations: ['customers']
            })
            .catch(() => []),

      // 13. Recent 5 Tasks
      this.taskRepository.query(
        `SELECT t.id, t.name, t.status, t."createdAt", t."createdBy"
         FROM task t
         INNER JOIN task_user tu ON tu."taskId" = t.id
         WHERE tu."userId" = $1 AND (t."createdAt" >= $2 OR t."updatedAt" >= $2)
         ORDER BY t."updatedAt" DESC
         LIMIT 5`,
        [user?.id, oneMonthAgo]
      ).catch(() => []),

      // 14. Recent 5 Notices
      this.noticeRepository.query(
        `SELECT id, title as name, "createdAt", "createdBy"
         FROM notice_board
         WHERE "createdAt" >= $1 OR "updatedAt" >= $1
         ORDER BY "updatedAt" DESC
         LIMIT 5`,
        [oneMonthAgo]
      ).catch(() => []),

      // 15. Recent 5 Phonebook Entries
      this.userRepository.query(
        `SELECT id, name, "phoneNumber", "createdAt", "createdBy"
         FROM phonebook_entries
         WHERE "createdAt" >= $1
         ORDER BY "createdAt" DESC
         LIMIT 5`,
        [oneMonthAgo]
      ).catch(() => []),

      // 16. Recent 5 Updated Projects
      !isSuperAdmin && accessibleProjectIds.length === 0
        ? Promise.resolve([])
        : this.projectRepository.query(
            isSuperAdmin
              ? `SELECT id, name, status, "updatedAt", "updatedBy", "createdBy" FROM project WHERE "updatedAt" >= $1 AND "updatedAt" > "createdAt" + interval '1 minute' ORDER BY "updatedAt" DESC LIMIT 5`
              : `SELECT id, name, status, "updatedAt", "updatedBy", "createdBy" FROM project WHERE id = ANY($2::uuid[]) AND "updatedAt" >= $1 AND "updatedAt" > "createdAt" + interval '1 minute' ORDER BY "updatedAt" DESC LIMIT 5`,
            isSuperAdmin ? [oneMonthAgo] : [oneMonthAgo, accessibleProjectIds]
          ).catch(() => []),

      // 17. Recent 5 Updated Clients
      !isSuperAdmin && accessibleCustomerIds.length === 0
        ? Promise.resolve([])
        : this.customerRepository.query(
            isSuperAdmin
              ? `SELECT id, name, status, "updatedAt", "updatedBy", "createdBy" FROM customer WHERE "updatedAt" >= $1 AND "updatedAt" > "createdAt" + interval '1 minute' ORDER BY "updatedAt" DESC LIMIT 5`
              : `SELECT id, name, status, "updatedAt", "updatedBy", "createdBy" FROM customer WHERE id = ANY($2::uuid[]) AND "updatedAt" >= $1 AND "updatedAt" > "createdAt" + interval '1 minute' ORDER BY "updatedAt" DESC LIMIT 5`,
            isSuperAdmin ? [oneMonthAgo] : [oneMonthAgo, accessibleCustomerIds]
          ).catch(() => []),

      // 18. Recent 5 Updated Users
      isSuperAdmin
        ? this.userRepository.query(
            `SELECT id, name, status, "updatedAt", "updatedBy", "createdBy" FROM "user" WHERE "updatedAt" >= $1 AND "updatedAt" > "createdAt" + interval '1 minute' ORDER BY "updatedAt" DESC LIMIT 5`,
            [oneMonthAgo]
          ).catch(() => [])
        : Promise.resolve([]),

      // 19. Recent 5 Updated Client Reports
      !isSuperAdmin && accessibleCustomerIds.length === 0
        ? Promise.resolve([])
        : this.clientReportRepository.query(
            isSuperAdmin
              ? `SELECT cr.id, cr.title as name, c.name as "clientName", cr."updatedAt", cr."updatedBy", cr."createdBy" FROM client_report cr LEFT JOIN customer c ON c.id = cr."customerId" WHERE cr."updatedAt" >= $1 AND cr."updatedAt" > cr."createdAt" + interval '1 minute' ORDER BY cr."updatedAt" DESC LIMIT 5`
              : `SELECT cr.id, cr.title as name, c.name as "clientName", cr."updatedAt", cr."updatedBy", cr."createdBy" FROM client_report cr LEFT JOIN customer c ON c.id = cr."customerId" WHERE cr."customerId" = ANY($2::uuid[]) AND cr."updatedAt" >= $1 AND cr."updatedAt" > cr."createdAt" + interval '1 minute' ORDER BY cr."updatedAt" DESC LIMIT 5`,
            isSuperAdmin ? [oneMonthAgo] : [oneMonthAgo, accessibleCustomerIds]
          ).catch(() => []),

      // 20. Recent 5 Updated Client Users
      !isSuperAdmin && accessibleCustomerIds.length === 0
        ? Promise.resolve([])
        : this.clientUserRepository.query(
            isSuperAdmin
              ? `SELECT id, name, email, status, "updatedAt", "updatedBy", "createdBy" FROM client_user WHERE "updatedAt" >= $1 AND "updatedAt" > "createdAt" + interval '1 minute' ORDER BY "updatedAt" DESC LIMIT 5`
              : `SELECT DISTINCT cu.id, cu.name, cu.email, cu.status, cu."updatedAt", cu."updatedBy", cu."createdBy" FROM client_user cu INNER JOIN client_user_customers cuc ON cuc."clientUserId" = cu.id WHERE cuc."customerId" = ANY($2::uuid[]) AND cu."updatedAt" >= $1 AND cu."updatedAt" > cu."createdAt" + interval '1 minute' ORDER BY cu."updatedAt" DESC LIMIT 5`,
            isSuperAdmin ? [oneMonthAgo] : [oneMonthAgo, accessibleCustomerIds]
          ).catch(() => []),

      // 21. Recent 5 Updated Tasks
      this.taskRepository.query(
        `SELECT t.id, t.name, t.status, t."updatedAt", t."updatedBy", t."createdBy"
         FROM task t
         INNER JOIN task_user tu ON tu."taskId" = t.id
         WHERE tu."userId" = $1 AND t."updatedAt" >= $2 AND t."updatedAt" > t."createdAt" + interval '1 minute'
         ORDER BY t."updatedAt" DESC
         LIMIT 5`,
        [user?.id, oneMonthAgo]
      ).catch(() => []),

      // 22. Recent 5 Updated Notices
      this.noticeRepository.query(
        `SELECT id, title as name, "updatedAt", "updatedBy", "createdBy"
         FROM notice_board
         WHERE "updatedAt" >= $1 AND "updatedAt" > "createdAt" + interval '1 minute'
         ORDER BY "updatedAt" DESC
         LIMIT 5`,
        [oneMonthAgo]
      ).catch(() => []),

      // 23. Recent 5 Updated Phonebook Entries
      this.userRepository.query(
        `SELECT id, name, "phoneNumber", "updatedAt", "updatedBy", "createdBy"
         FROM phonebook_entries
         WHERE "updatedAt" >= $1 AND "updatedAt" > "createdAt" + interval '1 minute'
         ORDER BY "updatedAt" DESC
         LIMIT 5`,
        [oneMonthAgo]
      ).catch(() => [])
    ]);

    const recentProjectsCount = projectCounts.recent;
    const totalProjectsCount = projectCounts.total;
    const recentClientsCount = clientCounts.recent;
    const totalClientsCount = clientCounts.total;
    const recentUsersCount = userCounts.recent;
    const totalUsersCount = userCounts.total;
    const recentClientReportsCount = reportCounts.recent;
    const totalClientReportsCount = reportCounts.total;
    const recentClientUsersCount = clientUserCounts.recent;
    const totalClientUsersCount = clientUserCounts.total;
    const recentTasksCount = taskCounts.recent;
    const totalPendingTasksCount = taskCounts.pending;
    const recentNoticesCount = noticeCounts.recent;
    const totalNoticesCount = noticeCounts.total;

    // Batch resolve creators & updaters for recent items
    const creatorIds = Array.from(
      new Set(
        [
          ...recentProjectsRaw,
          ...recentClientsRaw,
          ...recentUsersRaw,
          ...recentClientReportsRaw,
          ...recentClientUsersRaw,
          ...recentTasksRaw,
          ...recentNoticesRaw,
          ...recentPhonebookRaw,
          ...recentUpdatedProjectsRaw,
          ...recentUpdatedClientsRaw,
          ...recentUpdatedUsersRaw,
          ...recentUpdatedClientReportsRaw,
          ...recentUpdatedClientUsersRaw,
          ...recentUpdatedTasksRaw,
          ...recentUpdatedNoticesRaw,
          ...recentUpdatedPhonebookRaw
        ]
          .flatMap((r: any) => [r.createdBy, r.updatedBy])
          .filter(Boolean)
      )
    );

    let creatorMap = new Map<string, any>();
    if (creatorIds.length > 0) {
      try {
        const creators = await this.userRepository.find({
          where: { id: In(creatorIds) },
          select: ['id', 'name', 'email', 'avatar']
        });
        creatorMap = new Map(creators.map((c) => [c.id, c]));
      } catch (e) {
        console.error('Failed to batch resolve creators for sidebar summary:', e);
      }
    }

    const recentProjects = recentProjectsRaw.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      createdAt: p.createdAt,
      creator: p.createdBy ? creatorMap.get(p.createdBy) || null : null
    }));

    const recentClients = recentClientsRaw.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      createdAt: c.createdAt,
      creator: c.createdBy ? creatorMap.get(c.createdBy) || null : null
    }));

    const recentUsers = recentUsersRaw.map((u) => ({
      id: u.id,
      name: u.name,
      status: u.status,
      createdAt: u.createdAt,
      creator: u.createdBy ? creatorMap.get(u.createdBy) || null : null
    }));

    const recentClientReports = recentClientReportsRaw.map((r) => ({
      id: r.id,
      name: r.title,
      clientName: r.customer?.name || 'N/A',
      documentType: r.documentType?.name || 'Report',
      createdAt: r.createdAt,
      creator: r.createdBy ? creatorMap.get(r.createdBy) || null : null
    }));

    const recentClientUsers = recentClientUsersRaw.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      clientName: u.customers?.map((c: any) => c.name).join(', ') || 'N/A',
      status: u.status,
      createdAt: u.createdAt,
      creator: u.createdBy ? creatorMap.get(u.createdBy) || null : null
    }));

    const recentTasks = recentTasksRaw.map((t: any) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      createdAt: t.createdAt,
      creator: t.createdBy ? creatorMap.get(t.createdBy) || null : null
    }));

    const recentNotices = recentNoticesRaw.map((n: any) => ({
      id: n.id,
      name: n.name,
      createdAt: n.createdAt,
      creator: n.createdBy ? creatorMap.get(n.createdBy) || null : null
    }));

    const recentPhonebook = recentPhonebookRaw.map((p: any) => ({
      id: p.id,
      name: `${p.name} (${p.phoneNumber})`,
      createdAt: p.createdAt,
      creator: p.createdBy ? creatorMap.get(p.createdBy) || null : null
    }));

    const mapUpdated = (rows: any[], extra?: (r: any) => Record<string, any>) =>
      (rows || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        createdAt: r.updatedAt,
        creator: (r.updatedBy ? creatorMap.get(r.updatedBy) : null) || (r.createdBy ? creatorMap.get(r.createdBy) : null) || null,
        ...(extra ? extra(r) : {})
      }));

    const recentUpdatedProjects = mapUpdated(recentUpdatedProjectsRaw);
    const recentUpdatedClients = mapUpdated(recentUpdatedClientsRaw);
    const recentUpdatedUsers = mapUpdated(recentUpdatedUsersRaw);
    const recentUpdatedClientReports = mapUpdated(recentUpdatedClientReportsRaw, (r) => ({
      clientName: r.clientName || 'N/A'
    }));
    const recentUpdatedClientUsers = mapUpdated(recentUpdatedClientUsersRaw);
    const recentUpdatedTasks = mapUpdated(recentUpdatedTasksRaw);
    const recentUpdatedNotices = mapUpdated(recentUpdatedNoticesRaw);
    const recentUpdatedPhonebook = mapUpdated(recentUpdatedPhonebookRaw, (p) => ({
      name: `${p.name} (${p.phoneNumber})`
    }));

    const recentActivity = [
      ...recentProjects.map((p) => ({
        id: p.id,
        type: 'project' as const,
        title: p.name,
        action: 'New Project Created',
        createdAt: p.createdAt,
        creator: p.creator,
        link: '/projects/' + p.id
      })),
      ...recentClients.map((c) => ({
        id: c.id,
        type: 'client' as const,
        title: c.name,
        action: 'New Client Registered',
        createdAt: c.createdAt,
        creator: c.creator,
        link: '/client/view/' + c.id
      })),
      ...recentClientReports.map((r) => ({
        id: r.id,
        type: 'client_report' as const,
        title: r.name,
        action: `Client Report: ${r.clientName}`,
        createdAt: r.createdAt,
        creator: r.creator,
        link: '/client-reports'
      })),
      ...recentClientUsers.map((u) => ({
        id: u.id,
        type: 'client_user' as const,
        title: u.name,
        action: `Client User Added (${u.clientName})`,
        createdAt: u.createdAt,
        creator: u.creator,
        link: '/client-users'
      }))
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      counts: {
        // Recent counts (last 30 days)
        projects: recentProjectsCount,
        clients: recentClientsCount,
        users: recentUsersCount,
        clientReports: recentClientReportsCount,
        clientUsers: recentClientUsersCount,
        tasks: recentTasksCount,
        notices: recentNoticesCount,
        phonebook: phonebookCounts.recent,
        // Weekly counts (last 7 days - shown as sidebar badge when > 0)
        weeklyProjects: projectCounts.weekly,
        weeklyClients: clientCounts.weekly,
        weeklyUsers: userCounts.weekly,
        weeklyClientReports: reportCounts.weekly,
        weeklyClientUsers: clientUserCounts.weekly,
        weeklyTasks: taskCounts.weekly,
        weeklyNotices: noticeCounts.weekly,
        weeklyPhonebook: phonebookCounts.weekly,
        // Totals
        totalProjects: totalProjectsCount,
        totalClients: totalClientsCount,
        totalUsers: totalUsersCount,
        totalClientReports: totalClientReportsCount,
        totalClientUsers: totalClientUsersCount,
        totalTasks: totalPendingTasksCount,
        totalNotices: totalNoticesCount,
        totalPhonebook: phonebookCounts.total
      },
      recentProjects,
      recentClients,
      recentUsers,
      recentClientReports,
      recentClientUsers,
      recentTasks,
      recentNotices,
      recentPhonebook,
      recentUpdatedProjects,
      recentUpdatedClients,
      recentUpdatedUsers,
      recentUpdatedClientReports,
      recentUpdatedClientUsers,
      recentUpdatedTasks,
      recentUpdatedNotices,
      recentUpdatedPhonebook,
      recentActivity
    };
  }

  /**
   * Detailed Recent Changes & Activity Audit
   */
  async getRecentChanges(
    query: {
      type?: string;
      days?: number | string;
      startDate?: string;
      endDate?: string;
      action?: string;
      search?: string;
      limit?: number | string;
    },
    user?: UserEntity
  ) {
    const limitNum = Math.min(Math.max(parseInt(String(query.limit || 150), 10) || 150, 10), 500);
    const search = query.search ? query.search.trim().toLowerCase() : '';
    const actionFilter = query.action || 'all'; // 'all' | 'created' | 'updated'

    let sinceDate: Date;
    let untilDate: Date = moment().endOf('day').toDate();

    if (query.startDate && query.endDate) {
      sinceDate = moment(query.startDate).startOf('day').toDate();
      untilDate = moment(query.endDate).endOf('day').toDate();
    } else if (query.days && query.days !== 'all') {
      const d = parseInt(String(query.days), 10) || 30;
      sinceDate = moment().subtract(d, 'days').startOf('day').toDate();
    } else if (query.days === 'all') {
      sinceDate = moment().subtract(5, 'years').startOf('day').toDate();
    } else {
      sinceDate = moment().subtract(30, 'days').startOf('day').toDate();
    }

    const isSuperAdmin = user?.role?.name === 'superuser' || user?.role?.name === 'administrator';

    let accessibleProjectIds: string[] = [];
    let accessibleCustomerIds: string[] = [];

    if (!isSuperAdmin && user?.id) {
      const accessibleRows = await this.projectRepository
        .createQueryBuilder('p')
        .select('DISTINCT p.id', 'id')
        .addSelect('p.customerId', 'customerId')
        .leftJoin('p.users', 'pu')
        .where(
          '(pu.id = :userId OR p.projectLeadId = :userId OR p.projectManagerId = :userId OR p.createdBy = :userIdText)',
          { userId: user.id, userIdText: String(user.id) }
        )
        .getRawMany();

      accessibleProjectIds = accessibleRows.map((r) => r.id).filter(Boolean);
      accessibleCustomerIds = Array.from(new Set(accessibleRows.map((r) => r.customerId).filter(Boolean)));
    }

    // Helper to evaluate if record was created in the requested window
    const isCreatedInWindow = (createdAt: Date) => {
      if (!createdAt) return false;
      const d = new Date(createdAt);
      return d >= sinceDate && d <= untilDate;
    };

    // Helper to evaluate if record was updated in the requested window (and was an actual update, not initial creation)
    const isUpdatedInWindow = (createdAt: Date, updatedAt: Date) => {
      if (!updatedAt) return false;
      const u = new Date(updatedAt);
      if (u < sinceDate || u > untilDate) return false;
      if (!createdAt) return true;
      return Math.abs(u.getTime() - new Date(createdAt).getTime()) > 60000;
    };

    // Helper to evaluate created vs updated
    const isRecordUpdated = (createdAt: Date, updatedAt: Date) => {
      if (!updatedAt || !createdAt) return false;
      return Math.abs(new Date(updatedAt).getTime() - new Date(createdAt).getTime()) > 60000;
    };

    // Build database where clause based on action filter
    const buildWhereCondition = (extraCondition?: Record<string, any>) => {
      if (actionFilter === 'created') {
        return { createdAt: Between(sinceDate, untilDate), ...(extraCondition || {}) };
      }
      if (actionFilter === 'updated') {
        return { updatedAt: Between(sinceDate, untilDate), ...(extraCondition || {}) };
      }
      return [
        { createdAt: Between(sinceDate, untilDate), ...(extraCondition || {}) },
        { updatedAt: Between(sinceDate, untilDate), ...(extraCondition || {}) }
      ];
    };

    const orderCondition =
      actionFilter === 'created' ? { createdAt: 'DESC' } : { updatedAt: 'DESC' };
    const queryTake = Math.max(limitNum * 2, 300);

    // Parallel fetch across the 5 domains
    const [projectsRaw, clientsRaw, usersRaw, clientReportsRaw, clientUsersRaw] =
      await Promise.all([
        // 1. Projects
        !isSuperAdmin && accessibleProjectIds.length === 0
          ? Promise.resolve([])
          : this.projectRepository
              .find({
                where: buildWhereCondition(!isSuperAdmin ? { id: In(accessibleProjectIds) } : undefined),
                relations: ['customer', 'projectManager', 'projectLead', 'workingYear'],
                order: orderCondition as any,
                take: queryTake
              })
              .catch(() => []),

        // 2. Clients
        !isSuperAdmin && accessibleCustomerIds.length === 0
          ? Promise.resolve([])
          : this.customerRepository
              .find({
                where: buildWhereCondition(!isSuperAdmin ? { id: In(accessibleCustomerIds) } : undefined),
                relations: ['clientGroup'],
                order: orderCondition as any,
                take: queryTake
              })
              .catch(() => []),

        // 3. Team Users (only visible to superadmin/admin)
        isSuperAdmin
          ? this.userRepository
              .find({
                where: buildWhereCondition(),
                relations: ['role'],
                order: orderCondition as any,
                take: queryTake
              })
              .catch(() => [])
          : Promise.resolve([]),

        // 4. Client Reports
        !isSuperAdmin && accessibleCustomerIds.length === 0
          ? Promise.resolve([])
          : this.clientReportRepository
              .find({
                where: buildWhereCondition(!isSuperAdmin ? { customerId: In(accessibleCustomerIds) } : undefined),
                relations: ['customer', 'documentType', 'project', 'files'],
                order: orderCondition as any,
                take: queryTake
              })
              .catch(() => []),

        // 5. Client Users
        !isSuperAdmin && accessibleCustomerIds.length === 0
          ? Promise.resolve([])
          : this.clientUserRepository
              .find({
                where: buildWhereCondition(),
                relations: ['customers'],
                order: orderCondition as any,
                take: queryTake
              })
              .then((cus) => {
                if (isSuperAdmin) return cus;
                const custSet = new Set(accessibleCustomerIds);
                return cus.filter((cu) => cu.customers?.some((c: any) => custSet.has(c.id)));
              })
              .catch(() => [])
      ]);

    // Gather creator and updater IDs
    const userIds = Array.from(
      new Set(
        [
          ...projectsRaw.map((p) => p.createdBy),
          ...projectsRaw.map((p) => p.updatedBy),
          ...clientsRaw.map((c) => c.createdBy),
          ...clientsRaw.map((c) => c.updatedBy),
          ...usersRaw.map((u) => u.createdBy),
          ...usersRaw.map((u) => u.updatedBy),
          ...clientReportsRaw.map((r) => r.createdBy),
          ...clientReportsRaw.map((r) => r.updatedBy),
          ...clientUsersRaw.map((u) => u.createdBy),
          ...clientUsersRaw.map((u) => u.updatedBy)
        ].filter(Boolean)
      )
    );

    let userMap = new Map<string, any>();
    if (userIds.length > 0) {
      try {
        const users = await this.userRepository.find({
          where: { id: In(userIds) },
          select: ['id', 'name', 'email', 'avatar']
        });
        userMap = new Map(users.map((u) => [u.id, u]));
      } catch (e) {
        console.error('Failed to batch resolve users for recent changes:', e);
      }
    }

    // Process & Filter Projects
    const projects = projectsRaw
      .filter((p) => {
        const created = isCreatedInWindow(p.createdAt);
        const updated = isUpdatedInWindow(p.createdAt, p.updatedAt);
        if (actionFilter === 'created') return created;
        if (actionFilter === 'updated') return updated;
        return created || updated;
      })
      .map((p) => {
        const created = isCreatedInWindow(p.createdAt);
        const action =
          actionFilter === 'created'
            ? 'created'
            : actionFilter === 'updated'
            ? 'updated'
            : created
            ? 'created'
            : 'updated';
        const primaryDate = action === 'created' ? new Date(p.createdAt) : new Date(p.updatedAt);
        const isUpdated = isRecordUpdated(p.createdAt, p.updatedAt);
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          workingYear: p.workingYear?.name || null,
          workingYearId: p.workingYearId,
          clientName: p.customer?.name || 'N/A',
          clientId: p.customer?.id || null,
          managerName: p.projectManager?.name || null,
          leadName: p.projectLead?.name || null,
          action,
          isUpdated,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          primaryDate,
          creator: p.createdBy ? userMap.get(p.createdBy) || null : null,
          updater: p.updatedBy ? userMap.get(p.updatedBy) || null : null
        };
      })
      .filter((p) => {
        if (search) {
          const matched =
            p.name.toLowerCase().includes(search) ||
            p.clientName.toLowerCase().includes(search) ||
            (p.managerName && p.managerName.toLowerCase().includes(search)) ||
            (p.leadName && p.leadName.toLowerCase().includes(search)) ||
            (p.creator?.name && p.creator.name.toLowerCase().includes(search)) ||
            (p.updater?.name && p.updater.name.toLowerCase().includes(search));
          if (!matched) return false;
        }
        return true;
      })
      .sort((a, b) => b.primaryDate.getTime() - a.primaryDate.getTime())
      .slice(0, limitNum);

    // Process & Filter Clients
    const clients = clientsRaw
      .filter((c) => {
        const created = isCreatedInWindow(c.createdAt);
        const updated = isUpdatedInWindow(c.createdAt, c.updatedAt);
        if (actionFilter === 'created') return created;
        if (actionFilter === 'updated') return updated;
        return created || updated;
      })
      .map((c) => {
        const created = isCreatedInWindow(c.createdAt);
        const action =
          actionFilter === 'created'
            ? 'created'
            : actionFilter === 'updated'
            ? 'updated'
            : created
            ? 'created'
            : 'updated';
        const primaryDate = action === 'created' ? new Date(c.createdAt) : new Date(c.updatedAt);
        const isUpdated = isRecordUpdated(c.createdAt, c.updatedAt);
        return {
          id: c.id,
          name: c.name,
          shortName: c.shortName || null,
          panNo: c.panNo || '-',
          status: c.status,
          groupName: c.clientGroup?.name || null,
          groupId: c.clientGroup?.id || null,
          state: c.state || '-',
          district: c.district || '-',
          action,
          isUpdated,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          primaryDate,
          creator: c.createdBy ? userMap.get(c.createdBy) || null : null,
          updater: c.updatedBy ? userMap.get(c.updatedBy) || null : null
        };
      })
      .filter((c) => {
        if (search) {
          const matched =
            c.name.toLowerCase().includes(search) ||
            (c.shortName && c.shortName.toLowerCase().includes(search)) ||
            c.panNo.toLowerCase().includes(search) ||
            (c.groupName && c.groupName.toLowerCase().includes(search)) ||
            (c.creator?.name && c.creator.name.toLowerCase().includes(search)) ||
            (c.updater?.name && c.updater.name.toLowerCase().includes(search));
          if (!matched) return false;
        }
        return true;
      })
      .sort((a, b) => b.primaryDate.getTime() - a.primaryDate.getTime())
      .slice(0, limitNum);

    // Process & Filter Team Users
    const users = usersRaw
      .filter((u) => {
        const created = isCreatedInWindow(u.createdAt);
        const updated = isUpdatedInWindow(u.createdAt, u.updatedAt);
        if (actionFilter === 'created') return created;
        if (actionFilter === 'updated') return updated;
        return created || updated;
      })
      .map((u) => {
        const created = isCreatedInWindow(u.createdAt);
        const action =
          actionFilter === 'created'
            ? 'created'
            : actionFilter === 'updated'
            ? 'updated'
            : created
            ? 'created'
            : 'updated';
        const primaryDate = action === 'created' ? new Date(u.createdAt) : new Date(u.updatedAt);
        const isUpdated = isRecordUpdated(u.createdAt, u.updatedAt);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          username: u.username,
          role: u.role?.name || 'Member',
          status: u.status,
          avatar: u.avatar || null,
          action,
          isUpdated,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          primaryDate,
          creator: u.createdBy ? userMap.get(u.createdBy) || null : null,
          updater: u.updatedBy ? userMap.get(u.updatedBy) || null : null
        };
      })
      .filter((u) => {
        if (search) {
          const matched =
            u.name.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search) ||
            u.username.toLowerCase().includes(search) ||
            u.role.toLowerCase().includes(search) ||
            (u.creator?.name && u.creator.name.toLowerCase().includes(search)) ||
            (u.updater?.name && u.updater.name.toLowerCase().includes(search));
          if (!matched) return false;
        }
        return true;
      })
      .sort((a, b) => b.primaryDate.getTime() - a.primaryDate.getTime())
      .slice(0, limitNum);

    // Process & Filter Client Reports
    const clientReports = clientReportsRaw
      .filter((r) => {
        const created = isCreatedInWindow(r.createdAt);
        const updated = isUpdatedInWindow(r.createdAt, r.updatedAt);
        if (actionFilter === 'created') return created;
        if (actionFilter === 'updated') return updated;
        return created || updated;
      })
      .map((r) => {
        const created = isCreatedInWindow(r.createdAt);
        const action =
          actionFilter === 'created'
            ? 'created'
            : actionFilter === 'updated'
            ? 'updated'
            : created
            ? 'created'
            : 'updated';
        const primaryDate = action === 'created' ? new Date(r.createdAt) : new Date(r.updatedAt);
        const isUpdated = isRecordUpdated(r.createdAt, r.updatedAt);
        const fileName =
          r.originalFileName ||
          r.displayFileName ||
          (r.files && r.files[0] ? r.files[0].originalFileName : null) ||
          '-';
        return {
          id: r.id,
          title: r.title,
          description: r.description || null,
          clientName: r.customer?.name || 'N/A',
          clientId: r.customer?.id || null,
          projectName: r.project?.name || null,
          projectId: r.project?.id || null,
          documentType: r.documentType?.name || 'Report',
          fileName,
          fileCount: r.files?.length || (r.filePath ? 1 : 0),
          fileSize: r.fileSize || (r.files && r.files[0] ? r.files[0].fileSize : null),
          accessStatus: r.accessStatus || 'accessible',
          action,
          isUpdated,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          primaryDate,
          creator: r.createdBy ? userMap.get(r.createdBy) || null : null,
          updater: r.updatedBy ? userMap.get(r.updatedBy) || null : null
        };
      })
      .filter((r) => {
        if (search) {
          const matched =
            r.title.toLowerCase().includes(search) ||
            r.clientName.toLowerCase().includes(search) ||
            r.documentType.toLowerCase().includes(search) ||
            (r.creator?.name && r.creator.name.toLowerCase().includes(search)) ||
            (r.updater?.name && r.updater.name.toLowerCase().includes(search));
          if (!matched) return false;
        }
        return true;
      })
      .sort((a, b) => b.primaryDate.getTime() - a.primaryDate.getTime())
      .slice(0, limitNum);

    // Process & Filter Client Users
    const clientUsers = clientUsersRaw
      .filter((cu) => {
        const created = isCreatedInWindow(cu.createdAt);
        const updated = isUpdatedInWindow(cu.createdAt, cu.updatedAt);
        if (actionFilter === 'created') return created;
        if (actionFilter === 'updated') return updated;
        return created || updated;
      })
      .map((cu) => {
        const created = isCreatedInWindow(cu.createdAt);
        const action =
          actionFilter === 'created'
            ? 'created'
            : actionFilter === 'updated'
            ? 'updated'
            : created
            ? 'created'
            : 'updated';
        const primaryDate = action === 'created' ? new Date(cu.createdAt) : new Date(cu.updatedAt);
        const isUpdated = isRecordUpdated(cu.createdAt, cu.updatedAt);
        const clientNames = cu.customers?.map((c: any) => c.name).join(', ') || 'N/A';
        return {
          id: cu.id,
          name: cu.name,
          email: cu.email,
          phoneNumber: cu.phoneNumber || '-',
          status: cu.status,
          clientNames,
          clients: cu.customers?.map((c: any) => ({ id: c.id, name: c.name })) || [],
          lastLoginAt: cu.lastLoginAt || null,
          action,
          isUpdated,
          createdAt: cu.createdAt,
          updatedAt: cu.updatedAt,
          primaryDate,
          creator: cu.createdBy ? userMap.get(cu.createdBy) || null : null,
          updater: cu.updatedBy ? userMap.get(cu.updatedBy) || null : null
        };
      })
      .filter((cu) => {
        if (search) {
          const matched =
            cu.name.toLowerCase().includes(search) ||
            cu.email.toLowerCase().includes(search) ||
            cu.clientNames.toLowerCase().includes(search) ||
            (cu.creator?.name && cu.creator.name.toLowerCase().includes(search)) ||
            (cu.updater?.name && cu.updater.name.toLowerCase().includes(search));
          if (!matched) return false;
        }
        return true;
      })
      .sort((a, b) => b.primaryDate.getTime() - a.primaryDate.getTime())
      .slice(0, limitNum);

    // Unified Chronological Timeline Feed
    const allTimeline = [
      ...projects.map((p) => ({
        id: p.id,
        entityType: 'project' as const,
        entityLabel: 'Project',
        title: p.name,
        subtitle: `Client: ${p.clientName} ${p.workingYear ? `• FY: ${p.workingYear}` : ''}`,
        status: p.status,
        action: p.action,
        primaryDate: p.primaryDate,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        actor: p.action === 'updated' && p.updater ? p.updater : p.creator,
        link: `/projects/${p.id}`,
        badgeColor: 'blue'
      })),
      ...clients.map((c) => ({
        id: c.id,
        entityType: 'client' as const,
        entityLabel: 'Client',
        title: c.name,
        subtitle: `PAN: ${c.panNo} ${c.groupName ? `• Group: ${c.groupName}` : ''}`,
        status: c.status,
        action: c.action,
        primaryDate: c.primaryDate,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        actor: c.action === 'updated' && c.updater ? c.updater : c.creator,
        link: `/client/view/${c.id}`,
        badgeColor: 'green'
      })),
      ...users.map((u) => ({
        id: u.id,
        entityType: 'user' as const,
        entityLabel: 'Team Member',
        title: u.name,
        subtitle: `Role: ${u.role} • ${u.email}`,
        status: u.status,
        action: u.action,
        primaryDate: u.primaryDate,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        actor: u.action === 'updated' && u.updater ? u.updater : u.creator,
        link: `/users`,
        badgeColor: 'purple'
      })),
      ...clientReports.map((r) => ({
        id: r.id,
        entityType: 'client_report' as const,
        entityLabel: 'Client Report',
        title: r.title,
        subtitle: `Client: ${r.clientName} • Type: ${r.documentType}`,
        status: r.accessStatus,
        action: r.action,
        primaryDate: r.primaryDate,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        actor: r.action === 'updated' && r.updater ? r.updater : r.creator,
        link: `/client-reports`,
        badgeColor: 'cyan'
      })),
      ...clientUsers.map((cu) => ({
        id: cu.id,
        entityType: 'client_user' as const,
        entityLabel: 'Client User',
        title: cu.name,
        subtitle: `Client: ${cu.clientNames} • ${cu.email}`,
        status: cu.status,
        action: cu.action,
        primaryDate: cu.primaryDate,
        createdAt: cu.createdAt,
        updatedAt: cu.updatedAt,
        actor: cu.action === 'updated' && cu.updater ? cu.updater : cu.creator,
        link: `/client-users`,
        badgeColor: 'magenta'
      }))
    ]
      .sort((a, b) => b.primaryDate.getTime() - a.primaryDate.getTime())
      .slice(0, 300);

    // Summary calculations
    const todayThreshold = moment().startOf('day').toDate();
    const weekThreshold = moment().subtract(7, 'days').startOf('day').toDate();
    const monthThreshold = moment().subtract(30, 'days').startOf('day').toDate();

    const todayCount = allTimeline.filter((item) => item.primaryDate >= todayThreshold).length;
    const weekCount = allTimeline.filter((item) => item.primaryDate >= weekThreshold).length;
    const monthCount = allTimeline.filter((item) => item.primaryDate >= monthThreshold).length;

    return {
      summary: {
        totalRecords: allTimeline.length,
        todayCount,
        weekCount,
        monthCount,
        counts: {
          projects: projects.length,
          clients: clients.length,
          users: users.length,
          clientReports: clientReports.length,
          clientUsers: clientUsers.length
        }
      },
      projects,
      clients,
      users,
      clientReports,
      clientUsers,
      allTimeline
    };
  }
}
