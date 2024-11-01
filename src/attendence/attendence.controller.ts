import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards
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
@ApiTags('attendence')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('attendence')
@ApiBearerAuth()
export class AttendenceController {
  constructor(private readonly attendenceService: AttendenceService) {}

  @Post()
  create(
    @GetUser()
    user: UserEntity,
    @Body() createAttendanceDto: CreateAttendanceDto
  ): Promise<Attendance> {
    return this.attendenceService.create(createAttendanceDto, user);
  }

  @Get()
  findAll() {
    return this.attendenceService.findAll();
  }
  
  @Get('today-attendence')
  getMyAttendence(@GetUser() user: UserEntity) {
    return this.attendenceService.getMyAttendence(user);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    // console.log(id);
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
