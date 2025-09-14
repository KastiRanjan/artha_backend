import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendence.dto';
import { UpdateAttendenceDto } from './dto/update-attendence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendence.entity';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import * as moment from 'moment';
import { LeaveService } from 'src/leave/leave.service';
import { HolidayService } from 'src/holiday/holiday.service';
import { AttendanceHistory } from './entities/attendence-history.entity';

@Injectable()
export class AttendenceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(AttendanceHistory)
    private attendanceHistoryRepository: Repository<AttendanceHistory>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly leaveService: LeaveService,
    private readonly holidayService: HolidayService,
  ) {}

  async create(createAttendanceDto: CreateAttendanceDto, user: UserEntity): Promise<Attendance> {
    const today = moment().format('YYYY-MM-DD').toString();

    // Block if user is on approved leave today
    const leaves = await this.leaveService.findAll('approved');
    const onLeave = leaves.some(leave => leave.user.id === user.id && today >= leave.startDate && today <= leave.endDate);
    if (onLeave) {
      throw new ForbiddenException('You are on leave today. Attendance is not allowed.');
    }

    // Block if today is a holiday
    const holidays = await this.holidayService.findAll();
    const isHoliday = holidays.some(holiday => holiday.date === today);
    if (isHoliday) {
      throw new ForbiddenException('Today is a holiday. Attendance is not allowed.');
    }

    let attendance = await this.attendanceRepository.findOne({ 
      where: { userId: user.id, date: today },
      relations: ['history']
    });

    if (!attendance) {
      const datatosave = {
        ...createAttendanceDto,
        userId: user.id,
        date: today,
        clockIn: createAttendanceDto.clockIn || moment().format('HH:mm:ss a'),
        clockInRemark: createAttendanceDto.clockInRemark, // Include clockInRemark
      };
      attendance = this.attendanceRepository.create(datatosave);
      await this.attendanceRepository.save(attendance);
    }

    if (createAttendanceDto.clockOut) {
      const historyEntry = this.attendanceHistoryRepository.create({
        clockOut: createAttendanceDto.clockOut,
        latitude: createAttendanceDto.latitude,
        longitude: createAttendanceDto.longitude,
        remark: createAttendanceDto.remark,
        attendanceId: attendance.id,
      });
      await this.attendanceHistoryRepository.save(historyEntry);
      attendance.history = attendance.history || [];
      attendance.history.push(historyEntry);
    }

    return attendance;
  }

  async update(id: string, updateAttendenceDto: UpdateAttendenceDto): Promise<Attendance> {
    const attendance = await this.findOne(id);
    
    if (attendance.clockOut) {
      throw new NotFoundException(`Official clock-out already set for this record`);
    }

    await this.attendanceRepository.update(id, {
      clockOut: updateAttendenceDto.clockOut,
      clockOutRemark: updateAttendenceDto.clockOutRemark, // Include clockOutRemark
      latitude: updateAttendenceDto.latitude,
      longitude: updateAttendenceDto.longitude,
    });

    const historyEntry = this.attendanceHistoryRepository.create({
      clockOut: updateAttendenceDto.clockOut,
      latitude: updateAttendenceDto.latitude,
      longitude: updateAttendenceDto.longitude,
      remark: "final clock out", // Keep this for history, separate from clockOutRemark
      attendanceId: id,
    });
    await this.attendanceHistoryRepository.save(historyEntry);

    return this.findOne(id);
  }

  async findAll(user: UserEntity): Promise<Attendance[]> {
    return await this.attendanceRepository.find({ 
      where: { userId: user.id },
      relations: ['history']
    });
  }

  async findAllUsersAttendance(user: UserEntity): Promise<any[]> {
    // Check if user has super user permissions
    const isSuperUser = await this.checkSuperUserPermission(user);
    if (!isSuperUser) {
      throw new ForbiddenException('You do not have permission to view all users attendance');
    }

    // Fetch attendance records
    const attendanceRecords = await this.attendanceRepository.find({ 
      relations: ['history']
    });

    // Fetch all users
    const users = await this.userRepository.find();

    // Create a map for quick user lookup
    const userMap = new Map();
    users.forEach(u => {
      userMap.set(u.id, {
        name: u.name,
        email: u.email,
        username: u.username
      });
    });

    // Combine attendance with user data
    const result = attendanceRecords.map(attendance => {
      const userInfo = userMap.get(attendance.userId);
      
      return {
        ...attendance,
        user: userInfo || { 
          name: 'Unknown User', 
          email: 'N/A',
          username: 'unknown'
        }
      };
    });

    return result;
  }

  async getTodayAllUsersAttendance(user: UserEntity): Promise<any[]> {
    // Check if user has super user permissions
    const isSuperUser = await this.checkSuperUserPermission(user);
    if (!isSuperUser) {
      throw new ForbiddenException('You do not have permission to view all users attendance');
    }

    const today = moment().format('YYYY-MM-DD').toString();
    
    // Fetch today's attendance records
    const attendanceRecords = await this.attendanceRepository.find({ 
      where: { date: today },
      relations: ['history']
    });

    // Fetch all users
    const users = await this.userRepository.find();

    // Create a map for quick user lookup
    const userMap = new Map();
    users.forEach(u => {
      userMap.set(u.id, {
        name: u.name,
        email: u.email,
        username: u.username
      });
    });

    // Combine attendance with user data
    const result = attendanceRecords.map(attendance => {
      const userInfo = userMap.get(attendance.userId);
      
      return {
        ...attendance,
        user: userInfo || { 
          name: 'Unknown User', 
          email: 'N/A',
          username: 'unknown'
        }
      };
    });

    return result;
  }

  private async checkSuperUserPermission(user: UserEntity): Promise<boolean> {
    // Fetch user with role and permission relations to ensure we have the complete information
    const fullUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['role', 'role.permission']
    });
    
    if (!fullUser || !fullUser.role) {
      return false;
    }
    
    // Check for super user role names (including the actual role name from your system)
    const superUserRoles = ['super_user', 'admin', 'super-user', 'administrator', 'superuser'];
    const isRoleSuperUser = superUserRoles.includes(fullUser.role.name?.toLowerCase());
    
    // Check for specific attendance permissions
    const permissions = fullUser.role.permission || [];
    const hasAttendancePermission = permissions.some(permission => 
      permission.description === 'View All Users Attendance' ||
      permission.description === 'View Today All Users Attendance' ||
      permission.path?.includes('/attendance/all-users') ||
      permission.path?.includes('/attendance/today-all-users')
    );
    
    return isRoleSuperUser || hasAttendancePermission;
  }

  async findOne(id: string): Promise<Attendance | null> {
    const attendance = await this.attendanceRepository.findOne({ 
      where: { id },
      relations: ['history']
    });
    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
    return attendance;
  }

  async findByUser(userId: string): Promise<any[]> {
    // Fetch attendance records for specific user
    const attendanceRecords = await this.attendanceRepository.find({ 
      where: { userId },
      relations: ['history']
    });

    // Fetch the specific user
    const user = await this.userRepository.findOne({ where: { id: userId } });

    // Combine attendance with user data
    return attendanceRecords.map(attendance => ({
      ...attendance,
      user: user ? {
        name: user.name,
        email: user.email,
        username: user.username
      } : { 
        name: 'Unknown User', 
        email: 'N/A',
        username: 'unknown'
      }
    }));
  }

  async getMyAttendence(user: UserEntity): Promise<Attendance[]> {
    return await this.attendanceRepository.find({ 
      where: { 
        userId: user.id.toString(), 
        date: moment().format('YYYY-MM-DD').toString() 
      },
      relations: ['history']
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.attendanceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
    await this.attendanceHistoryRepository.delete({ attendanceId: id });
  }
}