import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkingYearService } from './working-year.service';
import { CreateWorkingYearDto } from './dto/create-working-year.dto';
import { UpdateWorkingYearDto } from './dto/update-working-year.dto';
import { UpdateWorkingYearConfigDto } from './dto/update-working-year-config.dto';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';

@ApiTags('working-years')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('working-years')
@ApiBearerAuth()
export class WorkingYearController {
  constructor(private readonly workingYearService: WorkingYearService) {}

  @Get()
  @ApiOperation({ summary: 'Get all working years' })
  findAll() {
    return this.workingYearService.findAll();
  }

  @Get('current')
  @ApiOperation({ summary: 'Get the active current working year' })
  findCurrent() {
    return this.workingYearService.findCurrent();
  }

  @Get('config')
  @ApiOperation({ summary: 'Get fiscal year system configuration (default start month/day)' })
  getConfig() {
    return this.workingYearService.getConfig();
  }

  @Patch('config')
  @ApiOperation({ summary: 'Update fiscal year system configuration' })
  updateConfig(@Body() dto: UpdateWorkingYearConfigDto) {
    return this.workingYearService.updateConfig(dto);
  }

  @Post('generate-next')
  @ApiOperation({ summary: 'Automatically generate next working year based on system setting' })
  generateNext() {
    return this.workingYearService.generateNextWorkingYear();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get working year by ID' })
  findOne(@Param('id') id: string) {
    return this.workingYearService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new working year' })
  create(@Body() dto: CreateWorkingYearDto) {
    return this.workingYearService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a working year' })
  update(@Param('id') id: string, @Body() dto: UpdateWorkingYearDto) {
    return this.workingYearService.update(id, dto);
  }

  @Patch(':id/set-current')
  @ApiOperation({ summary: 'Set this working year as current' })
  setCurrent(@Param('id') id: string) {
    return this.workingYearService.setCurrent(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a working year (if no projects attached)' })
  remove(@Param('id') id: string) {
    return this.workingYearService.remove(id);
  }
}
