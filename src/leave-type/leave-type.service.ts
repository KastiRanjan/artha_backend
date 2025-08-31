import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { LeaveType } from './entities/leave-type.entity';

@Injectable()
export class LeaveTypeService {
  constructor(
    @InjectRepository(LeaveType)
    private leaveTypeRepository: Repository<LeaveType>,
  ) {}

  async create(createLeaveTypeDto: CreateLeaveTypeDto): Promise<LeaveType> {
    // Check if leave type with same name already exists
    const existingLeaveType = await this.leaveTypeRepository.findOne({
      where: { name: createLeaveTypeDto.name }
    });

    if (existingLeaveType) {
      throw new ConflictException(`Leave type with name '${createLeaveTypeDto.name}' already exists`);
    }

    const leaveType = this.leaveTypeRepository.create(createLeaveTypeDto);
    return this.leaveTypeRepository.save(leaveType);
  }

  async findAll(): Promise<LeaveType[]> {
    return this.leaveTypeRepository.find({
      order: { createdAt: 'ASC' }
    });
  }

  async findAllActive(): Promise<LeaveType[]> {
    return this.leaveTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string): Promise<LeaveType> {
    const leaveType = await this.leaveTypeRepository.findOne({
      where: { id }
    });

    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${id} not found`);
    }

    return leaveType;
  }

  async update(id: string, updateLeaveTypeDto: UpdateLeaveTypeDto): Promise<LeaveType> {
    const leaveType = await this.findOne(id);

    // Check if name is being updated and if it conflicts with existing
    if (updateLeaveTypeDto.name && updateLeaveTypeDto.name !== leaveType.name) {
      const existingLeaveType = await this.leaveTypeRepository.findOne({
        where: { name: updateLeaveTypeDto.name }
      });

      if (existingLeaveType) {
        throw new ConflictException(`Leave type with name '${updateLeaveTypeDto.name}' already exists`);
      }
    }

    Object.assign(leaveType, updateLeaveTypeDto);
    return this.leaveTypeRepository.save(leaveType);
  }

  async remove(id: string): Promise<void> {
    const leaveType = await this.findOne(id);
    await this.leaveTypeRepository.remove(leaveType);
  }

  async toggleStatus(id: string): Promise<LeaveType> {
    const leaveType = await this.findOne(id);
    leaveType.isActive = !leaveType.isActive;
    return this.leaveTypeRepository.save(leaveType);
  }
}
