import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeaveTypeService } from './leave-type.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { PermissionGuard } from '../common/guard/permission.guard';
import JwtTwoFactorGuard from '../common/guard/jwt-two-factor.guard';

@ApiTags('leave-type')
@Controller('leave-type')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@ApiBearerAuth()
export class LeaveTypeController {
  constructor(private readonly leaveTypeService: LeaveTypeService) {}

  @Post()
  create(@Body(ValidationPipe) createLeaveTypeDto: CreateLeaveTypeDto) {
    return this.leaveTypeService.create(createLeaveTypeDto);
  }

  @Get()
  findAll() {
    return this.leaveTypeService.findAll();
  }

  @Get('active')
  findAllActive() {
    return this.leaveTypeService.findAllActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveTypeService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateLeaveTypeDto: UpdateLeaveTypeDto,
  ) {
    return this.leaveTypeService.update(id, updateLeaveTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveTypeService.remove(id);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.leaveTypeService.toggleStatus(id);
  }
}
