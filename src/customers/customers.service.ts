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
import { ClientGroup } from 'src/client-groups/entities/client-group.entity';
import { FuzzyMatcher } from './utils/fuzzy-matcher.util';

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
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ClientGroup)
    private clientGroupRepository: Repository<ClientGroup>
  ) {}

  async create(createCustomerDto: CreateCustomerDto, user?: UserEntity) {
    // Sanitize input
    const name = createCustomerDto.name ? createCustomerDto.name.trim().replace(/\s+/g, ' ') : '';
    const panNo = createCustomerDto.panNo ? createCustomerDto.panNo.trim() : '';

    let shortName = createCustomerDto.shortName?.trim();
    if (!shortName && name) {
      const suggestions = FuzzyMatcher.generateShortNameSuggestions(name);
      shortName = suggestions[0] || name.slice(0, 10).toUpperCase();
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      name,
      panNo,
      shortName,
      createdBy: user?.id || null,
      updatedBy: user?.id || null
    });
    
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

    // Handle client group reference if provided
    if (createCustomerDto.clientGroupId) {
      const clientGroup = await this.clientGroupRepository.findOne({
        where: { id: createCustomerDto.clientGroupId }
      });
      if (clientGroup) {
        customer.clientGroup = clientGroup;
      }
    }

    // Handle partner in charge if provided
    if (createCustomerDto.partnerInChargeId) {
      const partner = await this.userRepository.findOne({
        where: { id: createCustomerDto.partnerInChargeId }
      });
      if (partner) {
        customer.partnerInCharge = partner;
      }
    }
    
    return this.customerRepository.save(customer);
  }

  private async attachCreators(customers: Customer[]): Promise<any[]> {
    const userIds = Array.from(
      new Set(
        [
          ...customers.map(c => c.createdBy),
          ...customers.map(c => c.updatedBy)
        ].filter((id): id is string => Boolean(id))
      )
    );

    let userMap = new Map<string, any>();
    if (userIds.length > 0) {
      try {
        const users = await this.userRepository.find({
          where: { id: In(userIds) },
          select: ['id', 'name', 'email', 'avatar']
        });
        userMap = new Map(users.map(u => [u.id, u]));
      } catch (e) {
        console.error('Failed to batch resolve creators/updaters for customers:', e);
      }
    }

    return customers.map(c => ({
      ...c,
      creator: c.createdBy ? (userMap.get(c.createdBy) || null) : null,
      updater: c.updatedBy ? (userMap.get(c.updatedBy) || null) : null
    }));
  }

  async findAll() {
    const customers = await this.customerRepository.find({
      relations: ['businessSize', 'industryNature', 'legalStatus', 'clientGroup', 'partnerInCharge'],
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
      relations: ['businessSize', 'industryNature', 'legalStatus', 'clientGroup', 'partnerInCharge'],
      order: { createdAt: 'DESC' }
    });
    return this.attachCreators(customers);
  }

  async findOne(id: string) {
    const customer = await this.customerRepository.findOne({ 
      where: { id },
      relations: [
        'businessSize',
        'industryNature',
        'legalStatus',
        'clientGroup',
        'clientGroup.contacts',
        'partnerInCharge',
        'boardMembers',
        'managementTeamMembers',
        'registrationAndLicenses',
        'portalCredentials'
      ]
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Resolve creator and updater
    if (customer.createdBy) {
      const creator = await this.userRepository.findOne({
        where: { id: customer.createdBy },
        select: ['id', 'name', 'email', 'avatar']
      });
      (customer as any).creator = creator || null;
    } else {
      (customer as any).creator = null;
    }

    if (customer.updatedBy) {
      const updater = await this.userRepository.findOne({
        where: { id: customer.updatedBy },
        select: ['id', 'name', 'email', 'avatar']
      });
      (customer as any).updater = updater || null;
    } else {
      (customer as any).updater = null;
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, user?: UserEntity) {
    const customer = await this.findOne(id);
    
    // Handle business size reference if provided
    if (updateCustomerDto.businessSizeId !== undefined) {
      if (updateCustomerDto.businessSizeId) {
        const businessSize = await this.businessSizeRepository.findOne({ 
          where: { id: updateCustomerDto.businessSizeId } 
        });
        customer.businessSize = businessSize || null;
      } else {
        customer.businessSize = null;
      }
      delete updateCustomerDto.businessSizeId;
    }
    
    // Handle industry nature reference if provided
    if (updateCustomerDto.industryNatureId !== undefined) {
      if (updateCustomerDto.industryNatureId) {
        const businessNature = await this.businessNatureRepository.findOne({ 
          where: { id: updateCustomerDto.industryNatureId } 
        });
        customer.industryNature = businessNature || null;
      } else {
        customer.industryNature = null;
      }
      delete updateCustomerDto.industryNatureId;
    }
    
    // Handle legal status reference if provided
    if (updateCustomerDto.legalStatusId !== undefined) {
      if (updateCustomerDto.legalStatusId) {
        const legalStatus = await this.legalStatusRepository.findOne({ 
          where: { id: updateCustomerDto.legalStatusId } 
        });
        customer.legalStatus = legalStatus || null;
      } else {
        customer.legalStatus = null;
      }
      delete updateCustomerDto.legalStatusId;
    }

    // Handle client group reference
    if (updateCustomerDto.clientGroupId !== undefined) {
      if (updateCustomerDto.clientGroupId) {
        const group = await this.clientGroupRepository.findOne({
          where: { id: updateCustomerDto.clientGroupId }
        });
        customer.clientGroup = group || null;
        customer.clientGroupId = group ? group.id : null;
      } else {
        customer.clientGroup = null;
        customer.clientGroupId = null;
      }
      delete updateCustomerDto.clientGroupId;
    }

    // Handle partner in charge
    if (updateCustomerDto.partnerInChargeId !== undefined) {
      if (updateCustomerDto.partnerInChargeId) {
        const partner = await this.userRepository.findOne({
          where: { id: updateCustomerDto.partnerInChargeId }
        });
        customer.partnerInCharge = partner || null;
        customer.partnerInChargeId = partner ? partner.id : null;
      } else {
        customer.partnerInCharge = null;
        customer.partnerInChargeId = null;
      }
      delete updateCustomerDto.partnerInChargeId;
    }

    // Sanitize string fields
    if (updateCustomerDto.name) {
      updateCustomerDto.name = updateCustomerDto.name.trim().replace(/\s+/g, ' ');
    }
    if (updateCustomerDto.panNo) {
      updateCustomerDto.panNo = updateCustomerDto.panNo.trim();
    }
    if (updateCustomerDto.shortName) {
      updateCustomerDto.shortName = updateCustomerDto.shortName.trim();
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

  // --- Real-time Fuzzy Similarity Check & Short Name Generator ---

  async checkSimilarity(name?: string, panNo?: string, excludeId?: string): Promise<any> {
    const clients = await this.customerRepository.find({
      relations: ['clientGroup'],
      select: ['id', 'name', 'shortName', 'panNo', 'status', 'clientGroupId']
    });

    const cleanPan = panNo ? panNo.replace(/\D/g, '') : null;
    let exactPanMatch = null;
    if (cleanPan && cleanPan.length >= 7) {
      const match = clients.find(c => {
        if (excludeId && c.id === excludeId) return false;
        const cPan = (c.panNo || '').replace(/\D/g, '');
        return cPan === cleanPan;
      });
      if (match) {
        exactPanMatch = {
          id: match.id,
          name: match.name,
          shortName: match.shortName,
          panNo: match.panNo,
          status: match.status,
          clientGroup: match.clientGroup
        };
      }
    }

    const similarClients: any[] = [];
    if (name && name.trim().length >= 3) {
      const targetName = name.trim();
      for (const client of clients) {
        if (excludeId && client.id === excludeId) continue;
        const sim = FuzzyMatcher.calculateSimilarity(targetName, client.name);
        if (sim.score >= 55) {
          similarClients.push({
            id: client.id,
            name: client.name,
            shortName: client.shortName,
            panNo: client.panNo,
            status: client.status,
            clientGroup: client.clientGroup,
            score: sim.score,
            matchType: sim.matchType
          });
        }
      }
      // Sort highest similarity first
      similarClients.sort((a, b) => b.score - a.score);
    }

    const suggestedShortNames = name ? FuzzyMatcher.generateShortNameSuggestions(name) : [];

    return {
      panMatch: exactPanMatch,
      similarClients: similarClients.slice(0, 5),
      suggestedShortNames
    };
  }

  // --- Full Database Duplication & Audit Report ---

  async getDuplicationAuditReport(): Promise<any> {
    const clients = await this.customerRepository.find({
      relations: ['clientGroup', 'partnerInCharge'],
      order: { createdAt: 'DESC' }
    });

    // Batch resolve creators and updaters
    const userIds = Array.from(
      new Set(
        [
          ...clients.map(c => c.createdBy),
          ...clients.map(c => c.updatedBy)
        ].filter(Boolean)
      )
    );
    let userMap = new Map<string, any>();
    if (userIds.length > 0) {
      const users = await this.userRepository.find({
        where: { id: In(userIds) },
        select: ['id', 'name', 'email', 'avatar']
      });
      userMap = new Map(users.map(u => [u.id, u]));
    }

    // Detect duplicate pairs / clusters
    const duplicatePairs: any[] = [];

    for (let i = 0; i < clients.length; i++) {
      const c1 = clients[i];
      const c1Pan = (c1.panNo || '').replace(/\D/g, '');

      for (let j = i + 1; j < clients.length; j++) {
        const c2 = clients[j];
        const c2Pan = (c2.panNo || '').replace(/\D/g, '');

        let isPanMatch = false;
        if (c1Pan && c2Pan && c1Pan.length >= 7 && c1Pan === c2Pan) {
          isPanMatch = true;
        }

        const sim = FuzzyMatcher.calculateSimilarity(c1.name, c2.name);

        if (isPanMatch || sim.score >= 65) {
          duplicatePairs.push({
            id: `${c1.id}_${c2.id}`,
            score: isPanMatch ? 100 : sim.score,
            reason: isPanMatch ? 'Exact PAN Match' : `${sim.score}% Name Similarity`,
            matchType: isPanMatch ? 'exact' : sim.matchType,
            clientA: {
              id: c1.id,
              name: c1.name,
              shortName: c1.shortName,
              panNo: c1.panNo,
              status: c1.status,
              createdAt: c1.createdAt,
              clientGroup: c1.clientGroup ? { id: c1.clientGroup.id, name: c1.clientGroup.name } : null,
              creator: c1.createdBy ? userMap.get(c1.createdBy) || null : null
            },
            clientB: {
              id: c2.id,
              name: c2.name,
              shortName: c2.shortName,
              panNo: c2.panNo,
              status: c2.status,
              createdAt: c2.createdAt,
              clientGroup: c2.clientGroup ? { id: c2.clientGroup.id, name: c2.clientGroup.name } : null,
              creator: c2.createdBy ? userMap.get(c2.createdBy) || null : null
            }
          });
        }
      }
    }

    duplicatePairs.sort((a, b) => b.score - a.score);

    const clientAuditList = clients.map(c => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      panNo: c.panNo,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastEditReason: c.lastEditReason,
      clientGroup: c.clientGroup ? { id: c.clientGroup.id, name: c.clientGroup.name, code: c.clientGroup.code } : null,
      partnerInCharge: c.partnerInCharge ? { id: c.partnerInCharge.id, name: c.partnerInCharge.name } : null,
      creator: c.createdBy ? userMap.get(c.createdBy) || null : null,
      updater: c.updatedBy ? userMap.get(c.updatedBy) || null : null
    }));

    return {
      summary: {
        totalClients: clients.length,
        clientsInGroups: clients.filter(c => c.clientGroupId).length,
        standaloneClients: clients.filter(c => !c.clientGroupId).length,
        potentialDuplicatePairs: duplicatePairs.length
      },
      duplicatePairs,
      auditList: clientAuditList
    };
  }
}
