import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { BusinessSize } from 'src/business-size/entities/business-size.entity';
import { BusinessNature } from 'src/business-nature/entities/business-nature.entity';
import { LegalStatus } from 'src/legal-status/entities/legal-status.entity';

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
    private legalStatusRepository: Repository<LegalStatus>
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = this.customerRepository.create(createCustomerDto);
    
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

  findAll() {
    return this.customerRepository.find({
      relations: ['businessSize', 'industryNature', 'legalStatus']
    });
  }

  findByStatus(status: string) {
    return this.customerRepository.find({
      where: { status },
      relations: ['businessSize', 'industryNature', 'legalStatus']
    });
  }

  async findOne(id: string) {
    const customer = await this.customerRepository.findOne({ 
      where: { id },
      relations: ['businessSize', 'industryNature', 'legalStatus']
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
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
    return this.customerRepository.save(customer);
  }

  async remove(id: string) {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }
}
