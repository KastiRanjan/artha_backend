import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalStatus } from './entities/legal-status.entity';
import { CreateLegalStatusDto } from './dto/create-legal-status.dto';
import { UpdateLegalStatusDto } from './dto/update-legal-status.dto';

@Injectable()
export class LegalStatusService {
  constructor(
    @InjectRepository(LegalStatus)
    private legalStatusRepository: Repository<LegalStatus>,
  ) {}

  async create(createLegalStatusDto: CreateLegalStatusDto): Promise<LegalStatus> {
    const legalStatus = this.legalStatusRepository.create(createLegalStatusDto);
    return this.legalStatusRepository.save(legalStatus);
  }

  async findAll(): Promise<LegalStatus[]> {
    return this.legalStatusRepository.find();
  }

  async findActive(): Promise<LegalStatus[]> {
    return this.legalStatusRepository.find({
      where: { status: 'active' }
    });
  }

  async findOne(id: string): Promise<LegalStatus> {
    const legalStatus = await this.legalStatusRepository.findOne({
      where: { id }
    });
    
    if (!legalStatus) {
      throw new NotFoundException(`Legal status with ID ${id} not found`);
    }
    
    return legalStatus;
  }

  async update(id: string, updateLegalStatusDto: UpdateLegalStatusDto): Promise<LegalStatus> {
    const legalStatus = await this.findOne(id);
    Object.assign(legalStatus, updateLegalStatusDto);
    return this.legalStatusRepository.save(legalStatus);
  }

  async remove(id: string): Promise<void> {
    const legalStatus = await this.findOne(id);
    await this.legalStatusRepository.remove(legalStatus);
  }
}
