import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BusinessNatureService } from './business-nature.service';
import { CreateBusinessNatureDto } from './dto/create-business-nature.dto';
import { UpdateBusinessNatureDto } from './dto/update-business-nature.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import JwtTwoFactorGuard from '../common/guard/jwt-two-factor.guard';
import { PermissionGuard } from '../common/guard/permission.guard';

@ApiTags('business-nature')
@ApiBearerAuth()
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('business-nature')
export class BusinessNatureController {
  constructor(private readonly service: BusinessNatureService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Business Nature' })
  @ApiResponse({ status: 201, description: 'Business Nature created.' })
  create(@Body() dto: CreateBusinessNatureDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Business Natures' })
  @ApiResponse({ status: 200, description: 'List of Business Natures.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Business Nature by ID' })
  @ApiResponse({ status: 200, description: 'Business Nature found.' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Business Nature' })
  @ApiResponse({ status: 200, description: 'Business Nature updated.' })
  update(@Param('id') id: string, @Body() dto: UpdateBusinessNatureDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Business Nature' })
  @ApiResponse({ status: 200, description: 'Business Nature deleted.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
