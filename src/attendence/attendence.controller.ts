import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query
} from '@nestjs/common';
import { AttendenceService } from './attendence.service';
import { CreateAttendanceDto } from './dto/create-attendence.dto';
import { UpdateAttendenceDto } from './dto/update-attendence.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { Attendance } from './entities/attendence.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@ApiTags('attendance')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('attendance')
@ApiBearerAuth()
export class AttendenceController {
  constructor(private readonly attendenceService: AttendenceService) {}

  @Post()
  create(
    @GetUser() user: UserEntity,
    @Body() createAttendanceDto: CreateAttendanceDto
  ): Promise<Attendance> {
    return this.attendenceService.create(createAttendanceDto, user);
  }

  @Get()
  findAll(
    @GetUser() user: UserEntity,
  ) {
    return this.attendenceService.findAll(user);
  }

  @Get('all-users')
  findAllUsersAttendance(
    @GetUser() user: UserEntity,
  ) {
    return this.attendenceService.findAllUsersAttendance(user);
  }

  @Get('today-all-users')
  getTodayAllUsersAttendance(
    @GetUser() user: UserEntity,
  ) {
    return this.attendenceService.getTodayAllUsersAttendance(user);
  }

  @Get('date-wise-all-users')
  getDateWiseAllUsersAttendance(
    @GetUser() user: UserEntity,
    @Query('date') date: string,
  ) {
    return this.attendenceService.getDateWiseAllUsersAttendance(user, date);
  }
  
  @Get('today-attendence')
  getMyAttendence(@GetUser() user: UserEntity) {
    return this.attendenceService.getMyAttendence(user);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendenceService.findOne(id);
  }

  @Get('user/:id')
  find(@Param('id') id: string) {
    return this.attendenceService.findByUser(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAttendenceDto: UpdateAttendenceDto
  ) {
    return this.attendenceService.update(id, updateAttendenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendenceService.remove(id);
  }
}