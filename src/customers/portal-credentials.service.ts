import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortalCredential } from './entities/portal-credential.entity';
import { Customer } from './entities/customer.entity';
import { CreatePortalCredentialDto, UpdatePortalCredentialDto } from './dto/portal-credential.dto';

@Injectable()
export class PortalCredentialsService {
  constructor(
    @InjectRepository(PortalCredential)
    private portalCredentialRepository: Repository<PortalCredential>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>
  ) {}

  async create(customerId: string, createPortalCredentialDto: CreatePortalCredentialDto) {
    const customer = await this.customerRepository.findOne({ 
      where: { id: customerId }
    });
    
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }
    
    const portalCredential = this.portalCredentialRepository.create(createPortalCredentialDto);
    portalCredential.customer = customer;
    
    return this.portalCredentialRepository.save(portalCredential);
  }

  async findAll() {
    return this.portalCredentialRepository.find({
      relations: ['customer'],
      order: { createdAt: 'DESC' }
    });
  }

  async findAllByCustomer(customerId: string) {
    const customer = await this.customerRepository.findOne({ 
      where: { id: customerId }
    });
    
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }
    
    return this.portalCredentialRepository.find({
      where: { customer: { id: customerId } },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    const portalCredential = await this.portalCredentialRepository.findOne({ 
      where: { id },
      relations: ['customer']
    });
    
    if (!portalCredential) {
      throw new NotFoundException(`Portal credential with ID ${id} not found`);
    }
    
    return portalCredential;
  }

  async update(id: string, updatePortalCredentialDto: UpdatePortalCredentialDto) {
    const portalCredential = await this.findOne(id);
    
    Object.assign(portalCredential, updatePortalCredentialDto);
    return this.portalCredentialRepository.save(portalCredential);
  }

  async remove(id: string) {
    const portalCredential = await this.findOne(id);
    await this.portalCredentialRepository.remove(portalCredential);
    return { id };
  }
}
