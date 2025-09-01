
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { NatureOfWorkService } from './nature-of-work.service';
import { CreateNatureOfWorkDto } from './dto/create-nature-of-work.dto';
import { UpdateNatureOfWorkDto } from './dto/update-nature-of-work.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import JwtTwoFactorGuard from '../common/guard/jwt-two-factor.guard';
import { PermissionGuard } from '../common/guard/permission.guard';

@ApiTags('nature-of-work')
@ApiBearerAuth()
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('nature-of-work')
export class NatureOfWorkController {
  constructor(private readonly service: NatureOfWorkService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Nature of Work' })
  @ApiResponse({ status: 201, description: 'Nature of Work created.' })
  create(@Body() dto: CreateNatureOfWorkDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Nature of Work' })
  @ApiResponse({ status: 200, description: 'List of Nature of Work.' })
  findAll() {
    return this.service.findAll();
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
