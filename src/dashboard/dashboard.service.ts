import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    private readonly attendanceRepository: Repository<Attendance>
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
    
    // Get worklogs for the period
    const currentDate = moment(startDate);
    const dates: string[] = [];
    while (currentDate.isSameOrBefore(moment(endDate), 'day')) {
      dates.push(currentDate.format('YYYY-MM-DD'));
      currentDate.add(1, 'day');
    }

    const userStatsMap = new Map();

    for (const dbUser of allUsers) {
      let totalWorklogMinutes = 0;
      let totalAttendanceMinutes = 0;
      let daysWithWorklog = 0;
      let daysWithAttendance = 0;
      let overtimeDays = 0;
      let worklogExceedsAttendanceDays = 0;

      // Get role work hours
      const roleWorkhour = await this.workhourService.resolveForUser(dbUser.id, dbUser.roleId);
      const expectedDailyMinutes = roleWorkhour.workHours * 60;

      for (const dateStr of dates) {
        // Get worklogs for this date
        const worklogs = await this.worklogService.findByUserAndDate(dbUser.id, dateStr);
        
        // Get attendance for this date
        const attendanceRecords = await this.attendanceRepository.findOne({
          where: { 
            userId: dbUser.id,
            date: dateStr
          }
        });

        // Calculate worklog time
        let dailyWorklogMinutes = 0;
        if (worklogs && worklogs.length > 0) {
          for (const worklog of worklogs) {
            if (worklog.startTime && worklog.endTime) {
              const start = moment(worklog.startTime);
              const end = moment(worklog.endTime);
              dailyWorklogMinutes += end.diff(start, 'minutes');
            }
          }
          if (dailyWorklogMinutes > 0) {
            daysWithWorklog++;
            totalWorklogMinutes += dailyWorklogMinutes;

            // Check if exceeds expected hours
            if (dailyWorklogMinutes > expectedDailyMinutes) {
              overtimeDays++;
            }
          }
        }

        // Calculate attendance time
        let dailyAttendanceMinutes = 0;
        if (attendanceRecords) {
          if (attendanceRecords.clockIn && attendanceRecords.clockOut) {
            const clockIn = moment(attendanceRecords.clockIn, 'HH:mm:ss');
            const clockOut = moment(attendanceRecords.clockOut, 'HH:mm:ss');
            dailyAttendanceMinutes = clockOut.diff(clockIn, 'minutes');
            daysWithAttendance++;
            totalAttendanceMinutes += dailyAttendanceMinutes;
          }
        }

        // Check if worklog exceeds attendance
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
        expectedDailyHours: roleWorkhour.workHours,
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
}
