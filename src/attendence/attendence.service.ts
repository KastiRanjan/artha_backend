import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendence.dto';
import { UpdateAttendenceDto } from './dto/update-attendence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendence.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AttendenceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}
  async create(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    const attendance = this.attendanceRepository.create(createAttendanceDto);
    return this.attendanceRepository.save(attendance);
  }

  async findAll() {
    return await this.attendanceRepository.find(); // Should return all attendance records
  }

async findOne(id: number): Promise<Attendance | null> {
  const attendance = await this.attendanceRepository.findOne(id);
  if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
  }
  return attendance;
}
  async update(id: number, updateAttendenceDto: UpdateAttendenceDto) {
    await this.attendanceRepository.update(id, updateAttendenceDto); // Ensure update operation works
    return this.findOne(id); // Return updated attendance record
  }
  async remove(id: number): Promise<void> {
    const result = await this.attendanceRepository.delete(id);
    if (result.affected === 0) {
        throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
}
}

