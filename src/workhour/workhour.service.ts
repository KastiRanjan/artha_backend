import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workhour } from './entities/workhour.entity';
import { WorkhourHistory } from './entities/workhour-history.entity';
import { CreateWorkhourDto } from './dto/create-workhour.dto';
import { UpdateWorkhourDto } from './dto/update-workhour.dto';

@Injectable()
export class WorkhourService {
  constructor(
    @InjectRepository(Workhour)
    private readonly workhourRepository: Repository<Workhour>,
    @InjectRepository(WorkhourHistory)
    private readonly workhourHistoryRepository: Repository<WorkhourHistory>,
  ) {}

  async create(createWorkhourDto: CreateWorkhourDto): Promise<Workhour> {
    // Find any existing active workhour for this role
    const existingWorkhour = await this.workhourRepository.findOne({
      where: { 
        roleId: createWorkhourDto.roleId,
        isActive: true
      }
    });

    // If there's an existing record, deactivate it and move to history
    if (existingWorkhour) {
      // Create history record
      const historyRecord = this.workhourHistoryRepository.create({
        roleId: existingWorkhour.roleId,
        previousWorkHourId: existingWorkhour.id,
        workHours: existingWorkhour.workHours,
        startTime: existingWorkhour.startTime,
        endTime: existingWorkhour.endTime,
        validFrom: existingWorkhour.validFrom,
        validUntil: new Date(createWorkhourDto.validFrom), // End validity when new one starts
        createdAt: existingWorkhour.createdAt,
        updatedAt: new Date()
      });
      await this.workhourHistoryRepository.save(historyRecord);

      // Deactivate the old record
      existingWorkhour.isActive = false;
      await this.workhourRepository.save(existingWorkhour);
    }

    // Create new workhour record
    const workhour = this.workhourRepository.create({
      ...createWorkhourDto,
      validFrom: new Date(createWorkhourDto.validFrom),
      isActive: true
    });
    
    return this.workhourRepository.save(workhour);
  }

  async findAll(roleId?: string): Promise<Workhour[]> {
    const where: any = {};
    if (roleId) where.roleId = roleId;
    return this.workhourRepository.find({ 
      where,
      order: {
        validFrom: 'DESC'
      }
    });
  }

  async findOne(id: string): Promise<Workhour> {
    const workhour = await this.workhourRepository.findOne({ where: { id } });
    if (!workhour) throw new NotFoundException('Workhour config not found');
    return workhour;
  }

  async update(id: string, updateWorkhourDto: UpdateWorkhourDto): Promise<Workhour> {
    const workhour = await this.findOne(id);
    
    // Update and save
    Object.assign(workhour, updateWorkhourDto);
    if (updateWorkhourDto.validFrom) {
      workhour.validFrom = new Date(updateWorkhourDto.validFrom);
    }
    
    // Ensure isActive is set to true for the updated workhour
    if (updateWorkhourDto.validFrom) {
      workhour.isActive = true;
    }
    
    return this.workhourRepository.save(workhour);
  }

  async remove(id: string): Promise<void> {
    const result = await this.workhourRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Workhour config not found');
  }

  // Get workhour history for a role
  async getWorkhourHistory(roleId: string): Promise<WorkhourHistory[]> {
    return this.workhourHistoryRepository.find({
      where: { roleId },
      order: { validFrom: 'DESC' }
    });
  }

  // Resolve work hours for a user based on their role
  async resolveForUser(userId: string, roleId?: string): Promise<any> {
    if (!roleId) {
      throw new BadRequestException('Role ID is required for resolving workhours');
    }

    // Get active workhour for this role
    const workhour = await this.workhourRepository.findOne({ 
      where: { 
        roleId,
        isActive: true
      }
    });

    // Return the workhour if found, otherwise fallback to default
    if (workhour) {
      return {
        workHours: workhour.workHours,
        startTime: workhour.startTime,
        endTime: workhour.endTime,
        validFrom: workhour.validFrom
      };
    }

    // Fallback default
    return {
      workHours: 8,
      startTime: "09:00",
      endTime: "17:00",
      validFrom: new Date()
    };
  }
}
