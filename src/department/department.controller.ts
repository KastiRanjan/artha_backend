import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import JwtTwoFactorGuard from '../common/guard/jwt-two-factor.guard';
import { PermissionGuard } from '../common/guard/permission.guard';

@ApiTags('department')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('department')
@ApiBearerAuth()
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Department' })
  @ApiResponse({ status: 201, description: 'Department created.' })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Departments or active departments' })
  @ApiResponse({ status: 200, description: 'List of Departments.' })
  findAll(@Query('active') active: string) {
    if (active === 'true') {
      return this.departmentService.findActive();
    }
    return this.departmentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Department by ID' })
  @ApiResponse({ status: 200, description: 'Department found.' })
  findOne(@Param('id') id: string) {
    return this.departmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Department' })
  @ApiResponse({ status: 200, description: 'Department updated.' })
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentService.update(id, updateDepartmentDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle department active status' })
  @ApiResponse({ status: 200, description: 'Department active status toggled.' })
  toggleActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.departmentService.toggleActive(id, isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Department' })
  @ApiResponse({ status: 200, description: 'Department deleted.' })
  remove(@Param('id') id: string) {
    return this.departmentService.remove(id);
  }
}