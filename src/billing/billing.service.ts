import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { Billing } from './entities/billing.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Billing)
    private billingRepository: Repository<Billing>,
  ) {}

  async create(createBillingDto: CreateBillingDto): Promise<Billing> {
    const billing = this.billingRepository.create(createBillingDto);
    return this.billingRepository.save(billing);
  }

  async findAll(status?: 'active' | 'suspended' | 'archived'): Promise<Billing[]> {
    const query: any = {};
    if (status) {
      query.status = status;
    }
    return this.billingRepository.find({
      where: query,
      order: {
        updatedAt: 'DESC'
      }
    });
  }

  async findOne(id: string): Promise<Billing> {
    const billing = await this.billingRepository.findOne({
      where: { id },
      relations: ['projects']
    });
    
    if (!billing) {
      throw new NotFoundException(`Billing entity with ID ${id} not found`);
    }
    
    return billing;
  }

  async update(id: string, updateBillingDto: UpdateBillingDto): Promise<Billing> {
    const billing = await this.findOne(id);
    
    // Update billing entity with new values
    Object.assign(billing, updateBillingDto);
    
    return this.billingRepository.save(billing);
  }

  async remove(id: string): Promise<{ message: string }> {
    const billing = await this.findOne(id);
    await this.billingRepository.remove(billing);
    
    return { message: `Billing entity with ID ${id} removed successfully` };
  }
}
