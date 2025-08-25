import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leave } from './entities/leave.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>,
  ) {}

  async create(createLeaveDto: CreateLeaveDto): Promise<Leave> {
    const leave = this.leaveRepository.create({ ...createLeaveDto, status: 'pending' });
    return this.leaveRepository.save(leave);
  }

  async findAll(status?: string): Promise<Leave[]> {
    const where = status ? { status } : {};
    return this.leaveRepository.find({ where });
  }

  async findOne(id: string): Promise<Leave> {
    const leave = await this.leaveRepository.findOne({ where: { id } });
    if (!leave) throw new NotFoundException('Leave not found');
    return leave;
  }

  async update(id: string, updateLeaveDto: UpdateLeaveDto): Promise<Leave> {
    const leave = await this.findOne(id);
    Object.assign(leave, updateLeaveDto);
    return this.leaveRepository.save(leave);
  }

  async remove(id: string): Promise<void> {
    const result = await this.leaveRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Leave not found');
  }

  // Approval logic
  async approveByLead(id: string, userId: string): Promise<Leave> {
    const leave = await this.findOne(id);
    if (leave.status !== 'pending') throw new BadRequestException('Leave not pending');
    leave.status = 'approved_by_lead';
    leave.leadApproverId = userId;
    return this.leaveRepository.save(leave);
  }

  async approveByPM(id: string, userId: string): Promise<Leave> {
    const leave = await this.findOne(id);
    if (leave.status !== 'approved_by_lead') throw new BadRequestException('Leave not approved by lead');
    leave.status = 'approved_by_pm';
    leave.pmApproverId = userId;
    return this.leaveRepository.save(leave);
  }

  async approveByAdmin(id: string, userId: string): Promise<Leave> {
    const leave = await this.findOne(id);
    if (leave.status !== 'approved_by_pm') throw new BadRequestException('Leave not approved by PM');
    leave.status = 'approved';
    leave.adminApproverId = userId;
    return this.leaveRepository.save(leave);
  }

  async reject(id: string, userId: string): Promise<Leave> {
    const leave = await this.findOne(id);
    leave.status = 'rejected';
    // Optionally track who rejected
    return this.leaveRepository.save(leave);
  }

  // Calendar view: get all leaves in a date range, optionally filter by project
  async calendarView(from: string, to: string, projectId?: string): Promise<Leave[]> {
    // For now, just return all leaves in range; project filter can be added if relation exists
    return this.leaveRepository.createQueryBuilder('leave')
      .where('leave.startDate <= :to AND leave.endDate >= :from', { from, to })
      .getMany();
  }
}
