import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workhour } from './entities/workhour.entity';
import { CreateWorkhourDto } from './dto/create-workhour.dto';
import { UpdateWorkhourDto } from './dto/update-workhour.dto';

@Injectable()
export class WorkhourService {
  constructor(
    @InjectRepository(Workhour)
    private readonly workhourRepository: Repository<Workhour>,
  ) {}

  async create(createWorkhourDto: CreateWorkhourDto): Promise<Workhour> {
    const workhour = this.workhourRepository.create(createWorkhourDto);
    return this.workhourRepository.save(workhour);
  }

  async findAll(roleId?: string, userId?: string): Promise<Workhour[]> {
    const where: any = {};
    if (roleId) where.roleId = roleId;
    if (userId) where.userId = userId;
    return this.workhourRepository.find({ where });
  }

  async findOne(id: string): Promise<Workhour> {
    const workhour = await this.workhourRepository.findOne({ where: { id } });
    if (!workhour) throw new NotFoundException('Workhour config not found');
    return workhour;
  }

  async update(id: string, updateWorkhourDto: UpdateWorkhourDto): Promise<Workhour> {
    const workhour = await this.findOne(id);
    Object.assign(workhour, updateWorkhourDto);
    return this.workhourRepository.save(workhour);
  }

  async remove(id: string): Promise<void> {
    const result = await this.workhourRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Workhour config not found');
  }

  // Resolve work hours for a user (user override > role default > fallback)
  async resolveForUser(userId: string, roleId?: string): Promise<number> {
    // 1. Check for user-specific config
    const userConfig = await this.workhourRepository.findOne({ where: { userId } });
    if (userConfig) return userConfig.workHours;
    // 2. Check for role default
    if (roleId) {
      const roleConfig = await this.workhourRepository.findOne({ where: { roleId } });
      if (roleConfig) return roleConfig.workHours;
    }
    // 3. Fallback default
    return 8;
  }
}
