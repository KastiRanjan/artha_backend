import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { DashboardService } from 'src/dashboard/dashboard.service';
import { OsStatsInterface } from 'src/dashboard/interface/os-stats.interface';
import { UsersStatsInterface } from 'src/dashboard/interface/user-stats.interface';
import { BrowserStatsInterface } from 'src/dashboard/interface/browser-stats.interface';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';

@ApiTags('dashboard')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/users')
  userStat(): Promise<UsersStatsInterface> {
    return this.dashboardService.getUserStat();
  }

  @Get('/os')
  osStat(): Promise<Array<OsStatsInterface>> {
    return this.dashboardService.getOsData();
  }

  @Get('/browser')
  browserStat(): Promise<Array<BrowserStatsInterface>> {
    return this.dashboardService.getBrowserData();
  }

  @Get('/attendance')
  getAttendanceStats(@GetUser() user: UserEntity, @Query('date') date?: string) {
    return this.dashboardService.getAttendanceStats(user, date);
  }

  @Get('/working-time')
  getWorkingTimeStats(
    @GetUser() user: UserEntity,
    @Query('date') date?: string,
    @Query('period') period?: 'day' | 'week' | 'month'
  ) {
    return this.dashboardService.getWorkingTimeStats(user, date, period);
  }
}
