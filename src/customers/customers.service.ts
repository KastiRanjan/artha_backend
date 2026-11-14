import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { BusinessSize } from 'src/business-size/entities/business-size.entity';
import { BusinessNature } from 'src/business-nature/entities/business-nature.entity';
import { LegalStatus } from 'src/legal-status/entities/legal-status.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(BusinessSize)
    private businessSizeRepository: Repository<BusinessSize>,
    @InjectRepository(BusinessNature)
    private businessNatureRepository: Repository<BusinessNature>,
    @InjectRepository(LegalStatus)
    private legalStatusRepository: Repository<LegalStatus>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>
  ) {}

  async create(createCustomerDto: CreateCustomerDto, user?: UserEntity) {
    const customer = this.customerRepository.create(createCustomerDto);
    customer.createdBy = user?.id || null;
    customer.updatedBy = user?.id || null;
    
    // Handle business size reference if provided
    if (createCustomerDto.businessSizeId) {
      const businessSize = await this.businessSizeRepository.findOne({ 
        where: { id: createCustomerDto.businessSizeId } 
      });
      if (businessSize) {
        customer.businessSize = businessSize;
      }
    }
    
    // Handle industry nature reference if provided
    if (createCustomerDto.industryNatureId) {
      const businessNature = await this.businessNatureRepository.findOne({ 
        where: { id: createCustomerDto.industryNatureId } 
      });
      if (businessNature) {
        customer.industryNature = businessNature;
      }
    }
    
    // Handle legal status reference if provided
    if (createCustomerDto.legalStatusId) {
      const legalStatus = await this.legalStatusRepository.findOne({ 
        where: { id: createCustomerDto.legalStatusId } 
      });
      if (legalStatus) {
        customer.legalStatus = legalStatus;
      }
    }
    
    return this.customerRepository.save(customer);
  }

  private async attachCreators(customers: Customer[]): Promise<any[]> {
    const creatorIds = Array.from(new Set(customers.map(c => c.createdBy).filter((id): id is string => Boolean(id))));
    let creatorMap = new Map<string, any>();
    if (creatorIds.length > 0) {
      try {
        const creators = await this.userRepository.find({
          where: { id: In(creatorIds) },
          select: ['id', 'name', 'email', 'avatar']
        });
        creatorMap = new Map(creators.map(c => [c.id, c]));
      } catch (e) {
        console.error('Failed to batch resolve creators for customers:', e);
      }
    }
    return customers.map(c => ({
      ...c,
      creator: c.createdBy ? (creatorMap.get(c.createdBy) || null) : null
    }));
  }

  async findAll() {
    const customers = await this.customerRepository.find({
      relations: ['businessSize', 'industryNature', 'legalStatus'],
      order: { createdAt: 'DESC' }
    });
    return this.attachCreators(customers);
  }

  async findByStatus(status: string) {
    if (status && status.toLowerCase() === 'all') {
      return this.findAll();
    }
    const customers = await this.customerRepository.find({
      where: { status: status as any },
      relations: ['businessSize', 'industryNature', 'legalStatus'],
      order: { createdAt: 'DESC' }
    });
    return this.attachCreators(customers);
  }

  async findOne(id: string) {
    const customer = await this.customerRepository.findOne({ 
      where: { id },
      relations: ['businessSize', 'industryNature', 'legalStatus']
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    if (customer.createdBy) {
      try {
        const creator = await this.userRepository.findOne({
          where: { id: customer.createdBy },
          select: ['id', 'name', 'email', 'avatar']
        });
        (customer as any).creator = creator || null;
      } catch (e) {
        (customer as any).creator = null;
      }
    } else {
      (customer as any).creator = null;
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, user?: UserEntity) {
    const customer = await this.findOne(id);
    
    // Handle business size reference if provided
    if (updateCustomerDto.businessSizeId) {
      const businessSize = await this.businessSizeRepository.findOne({ 
        where: { id: updateCustomerDto.businessSizeId } 
      });
      if (businessSize) {
        customer.businessSize = businessSize;
      }
      // Remove businessSizeId from DTO to prevent TypeORM errors
      delete updateCustomerDto.businessSizeId;
    }
    
    // Handle industry nature reference if provided
    if (updateCustomerDto.industryNatureId) {
      const businessNature = await this.businessNatureRepository.findOne({ 
        where: { id: updateCustomerDto.industryNatureId } 
      });
      if (businessNature) {
        customer.industryNature = businessNature;
      }
      // Remove industryNatureId from DTO to prevent TypeORM errors
      delete updateCustomerDto.industryNatureId;
    }
    
    // Handle legal status reference if provided
    if (updateCustomerDto.legalStatusId) {
      const legalStatus = await this.legalStatusRepository.findOne({ 
        where: { id: updateCustomerDto.legalStatusId } 
      });
      if (legalStatus) {
        customer.legalStatus = legalStatus;
      }
      // Remove legalStatusId from DTO to prevent TypeORM errors
      delete updateCustomerDto.legalStatusId;
    }
    
    Object.assign(customer, updateCustomerDto);
    if (user?.id) {
      customer.updatedBy = user.id;
    }
    return this.customerRepository.save(customer);
  }

  async remove(id: string) {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }
}
