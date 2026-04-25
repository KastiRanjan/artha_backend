import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { WorklogService } from './worklog.service';

@ApiTags('projects-worklogs')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('projects')
@ApiBearerAuth()
export class ProjectWorklogController {
  constructor(private readonly worklogService: WorklogService) {}

  @Get(':id/worklogs')
  findProjectWorklogs(@Param('id') id: string) {
    return this.worklogService.findProjectWorklogs(id);
  }
}