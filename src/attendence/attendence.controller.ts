import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AttendenceService } from './attendence.service';
import { CreateAttendanceDto } from './dto/create-attendence.dto';
import { UpdateAttendenceDto } from './dto/update-attendence.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { Attendance } from './entities/attendence.entity';
@ApiTags('attendence')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('attendence')
@ApiBearerAuth()
export class AttendenceController {
  constructor(private readonly attendenceService: AttendenceService) {}

  @Post()
  create(@Body() createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    return this.attendenceService.create(createAttendanceDto);
  }

  @Get()
  findAll() {
    return this.attendenceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendenceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAttendenceDto: UpdateAttendenceDto) {
    return this.attendenceService.update(+id, updateAttendenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendenceService.remove(+id);
  }
}
