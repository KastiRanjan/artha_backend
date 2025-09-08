import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BusinessSizeService } from './business-size.service';
import { CreateBusinessSizeDto } from './dto/create-business-size.dto';
import { UpdateBusinessSizeDto } from './dto/update-business-size.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import JwtTwoFactorGuard from '../common/guard/jwt-two-factor.guard';
import { PermissionGuard } from '../common/guard/permission.guard';

@ApiTags('business-size')
@ApiBearerAuth()
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('business-size')
export class BusinessSizeController {
  constructor(private readonly service: BusinessSizeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Business Size' })
  @ApiResponse({ status: 201, description: 'Business Size created.' })
  create(@Body() dto: CreateBusinessSizeDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Business Sizes' })
  @ApiResponse({ status: 200, description: 'List of Business Sizes.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Business Size by ID' })
  @ApiResponse({ status: 200, description: 'Business Size found.' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Business Size' })
  @ApiResponse({ status: 200, description: 'Business Size updated.' })
  update(@Param('id') id: string, @Body() dto: UpdateBusinessSizeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Business Size' })
  @ApiResponse({ status: 200, description: 'Business Size deleted.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
