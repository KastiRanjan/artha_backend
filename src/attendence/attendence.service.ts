import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendence.dto';
import { UpdateAttendenceDto } from './dto/update-attendence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendence.entity';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import * as moment from 'moment';

@Injectable()
export class AttendenceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}
  async create(createAttendanceDto: CreateAttendanceDto, user: UserEntity): Promise<Attendance> {
    const datatosave = {
      ...createAttendanceDto,
      userId:user.id ,
    }
    const attendance = this.attendanceRepository.create(datatosave);
    
    return this.attendanceRepository.save(attendance);
  }

  async findAll() {
    return await this.attendanceRepository.find(); // Should return all attendance records
  }

async findOne(id: string): Promise<Attendance | null> {
  const attendance = await this.attendanceRepository.findOne(id);
  if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
  }
  return attendance;
}

async findByUser(userId: string): Promise<Attendance[]> {
  return await this.attendanceRepository.find({ where: { userId } });
}


async getMyAttendence(user: UserEntity): Promise<Attendance[]> {
  return await this.attendanceRepository.find({ where: { userId: (user.id).toString(), date: moment().format('YYYY-MM-DD').toString() }});
}


  async update(id: string, updateAttendenceDto: UpdateAttendenceDto) {
    await this.attendanceRepository.update(id, updateAttendenceDto); // Ensure update operation works
    return this.findOne(id); // Return updated attendance record
  }
  async remove(id: string): Promise<void> {
    const result = await this.attendanceRepository.delete(id);
    if (result.affected === 0) {
        throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
}
}

