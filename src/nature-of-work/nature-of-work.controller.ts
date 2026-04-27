
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { NatureOfWorkService } from './nature-of-work.service';
import { CreateNatureOfWorkDto } from './dto/create-nature-of-work.dto';
import { UpdateNatureOfWorkDto } from './dto/update-nature-of-work.dto';
import { CreateNatureOfWorkGroupDto } from './dto/create-nature-of-work-group.dto';
import { UpdateNatureOfWorkGroupDto } from './dto/update-nature-of-work-group.dto';
import { MigrateNatureOfWorkDto } from './dto/migrate-nature-of-work.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import JwtTwoFactorGuard from '../common/guard/jwt-two-factor.guard';
import { PermissionGuard } from '../common/guard/permission.guard';

@ApiTags('nature-of-work')
@ApiBearerAuth()
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('nature-of-work')
export class NatureOfWorkController {
  constructor(private readonly service: NatureOfWorkService) {}

  // ==========================================
  // Nature of Work CRUD
  // ==========================================

  @Post()
  @ApiOperation({ summary: 'Create a new Nature of Work' })
  @ApiResponse({ status: 201, description: 'Nature of Work created.' })
  create(@Body() dto: CreateNatureOfWorkDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Nature of Work (active only by default)' })
  @ApiResponse({ status: 200, description: 'List of Nature of Work.' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  // ==========================================
  // Group CRUD
  // ==========================================

  @Post('group')
  @ApiOperation({ summary: 'Create a Nature of Work Group' })
  @ApiResponse({ status: 201, description: 'Group created.' })
  createGroup(@Body() dto: CreateNatureOfWorkGroupDto) {
    return this.service.createGroup(dto);
  }

  @Get('group/all')
  @ApiOperation({ summary: 'Get all Nature of Work Groups' })
  @ApiResponse({ status: 200, description: 'List of groups.' })
  findAllGroups() {
    return this.service.findAllGroups();
  }

  @Get('group/:id')
  @ApiOperation({ summary: 'Get a Nature of Work Group by ID' })
  @ApiResponse({ status: 200, description: 'Group found.' })
  findOneGroup(@Param('id') id: string) {
    return this.service.findOneGroup(id);
  }

  @Patch('group/:id')
  @ApiOperation({ summary: 'Update a Nature of Work Group' })
  @ApiResponse({ status: 200, description: 'Group updated.' })
  updateGroup(@Param('id') id: string, @Body() dto: UpdateNatureOfWorkGroupDto) {
    return this.service.updateGroup(id, dto);
  }

  @Delete('group/:id')
  @ApiOperation({ summary: 'Delete a Nature of Work Group' })
  @ApiResponse({ status: 200, description: 'Group deleted.' })
  removeGroup(@Param('id') id: string) {
    return this.service.removeGroup(id);
  }

  // ==========================================
  // Migration
  // ==========================================

  @Post('migrate')
  @ApiOperation({ summary: 'Migrate nature of work with project dependency handling' })
  @ApiResponse({ status: 200, description: 'Migration completed.' })
  migrate(@Body() dto: MigrateNatureOfWorkDto) {
    return this.service.migrate(dto);
  }

  // ==========================================
  // Affected Projects
  // ==========================================

  @Get(':id/affected-projects')
  @ApiOperation({ summary: 'Get all projects using this Nature of Work' })
  @ApiResponse({ status: 200, description: 'List of affected projects.' })
  getAffectedProjects(@Param('id') id: string) {
    return this.service.getAffectedProjects(id);
  }

  @Get(':id/active-affected-projects')
  @ApiOperation({ summary: 'Get active projects using this Nature of Work' })
  @ApiResponse({ status: 200, description: 'List of active affected projects.' })
  getActiveAffectedProjects(@Param('id') id: string) {
    return this.service.getActiveAffectedProjects(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Nature of Work by ID' })
  @ApiResponse({ status: 200, description: 'Nature of Work found.' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Nature of Work' })
  @ApiResponse({ status: 200, description: 'Nature of Work updated.' })
  update(@Param('id') id: string, @Body() dto: UpdateNatureOfWorkDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Nature of Work' })
  @ApiResponse({ status: 200, description: 'Nature of Work deleted.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
