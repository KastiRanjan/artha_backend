import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClientGroup } from './entities/client-group.entity';
import { GroupContact } from './entities/group-contact.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Project } from 'src/projects/entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { CreateClientGroupDto } from './dto/create-client-group.dto';
import { UpdateClientGroupDto } from './dto/update-client-group.dto';
import { CreateGroupContactDto } from './dto/create-group-contact.dto';

@Injectable()
export class ClientGroupsService {
  constructor(
    @InjectRepository(ClientGroup)
    private readonly clientGroupRepository: Repository<ClientGroup>,
    @InjectRepository(GroupContact)
    private readonly groupContactRepository: Repository<GroupContact>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async create(createDto: CreateClientGroupDto, user?: UserEntity): Promise<ClientGroup> {
    const existing = await this.clientGroupRepository.findOne({
      where: { name: createDto.name.trim() }
    });
    if (existing) {
      throw new ConflictException(`Client Group with name "${createDto.name}" already exists`);
    }

    const group = this.clientGroupRepository.create({
      ...createDto,
      name: createDto.name.trim(),
      createdBy: user?.id || null,
      updatedBy: user?.id || null
    });

    return this.clientGroupRepository.save(group);
  }

  async findAll(): Promise<any[]> {
    const groups = await this.clientGroupRepository.find({
      relations: ['partnerInCharge', 'contacts'],
      order: { name: 'ASC' }
    });

    // Compute member entity count and active projects count for each group
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await this.customerRepository.count({
          where: { clientGroupId: group.id }
        });

        const activeProjectsCount = await this.projectRepository
          .createQueryBuilder('p')
          .innerJoin('p.customer', 'c', 'c.clientGroupId = :groupId', { groupId: group.id })
          .where('p.status = :status', { status: 'active' })
          .getCount();

        return {
          ...group,
          memberCount,
          activeProjectsCount
        };
      })
    );

    return groupsWithStats;
  }

  async findOne(id: string): Promise<any> {
    const group = await this.clientGroupRepository.findOne({
      where: { id },
      relations: ['partnerInCharge', 'contacts']
    });

    if (!group) {
      throw new NotFoundException(`Client Group with ID "${id}" not found`);
    }

    // Fetch member entities with basic project count
    const memberCustomers = await this.customerRepository.find({
      where: { clientGroupId: id },
      relations: ['businessSize', 'industryNature', 'legalStatus'],
      order: { name: 'ASC' }
    });

    const customersWithProjectCount = await Promise.all(
      memberCustomers.map(async (c) => {
        const totalProjects = await this.projectRepository.count({ where: { customer: { id: c.id } } });
        const activeProjects = await this.projectRepository.count({
          where: { customer: { id: c.id }, status: 'active' }
        });
        return {
          ...c,
          totalProjects,
          activeProjects
        };
      })
    );

    // Resolve creator info
    let creator = null;
    if (group.createdBy) {
      creator = await this.userRepository.findOne({
        where: { id: group.createdBy },
        select: ['id', 'name', 'email', 'avatar']
      });
    }

    return {
      ...group,
      creator,
      customers: customersWithProjectCount
    };
  }

  async update(id: string, updateDto: UpdateClientGroupDto, user?: UserEntity): Promise<ClientGroup> {
    const group = await this.clientGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Client Group with ID "${id}" not found`);
    }

    if (updateDto.name && updateDto.name.trim() !== group.name) {
      const existing = await this.clientGroupRepository.findOne({
        where: { name: updateDto.name.trim() }
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Another Client Group with name "${updateDto.name}" already exists`);
      }
      group.name = updateDto.name.trim();
    }

    Object.assign(group, updateDto);
    if (user?.id) {
      group.updatedBy = user.id;
    }

    return this.clientGroupRepository.save(group);
  }

  async remove(id: string): Promise<{ message: string }> {
    const group = await this.clientGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Client Group with ID "${id}" not found`);
    }

    // Unlink customers from this group
    await this.customerRepository.update({ clientGroupId: id }, { clientGroupId: null });

    // Delete contacts and group
    await this.groupContactRepository.delete({ clientGroupId: id });
    await this.clientGroupRepository.remove(group);

    return { message: `Client Group "${group.name}" deleted successfully` };
  }

  // --- Group Contacts Sub-resource ---

  async addContact(groupId: string, createContactDto: CreateGroupContactDto, user?: UserEntity): Promise<GroupContact> {
    const group = await this.clientGroupRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Client Group with ID "${groupId}" not found`);
    }

    // If marked primary, unset other primaries
    if (createContactDto.isPrimary) {
      await this.groupContactRepository.update({ clientGroupId: groupId }, { isPrimary: false });
    }

    const contact = this.groupContactRepository.create({
      ...createContactDto,
      clientGroupId: groupId,
      createdBy: user?.id || null,
      updatedBy: user?.id || null
    });

    return this.groupContactRepository.save(contact);
  }

  async updateContact(contactId: string, updateContactDto: Partial<CreateGroupContactDto>, user?: UserEntity): Promise<GroupContact> {
    const contact = await this.groupContactRepository.findOne({ where: { id: contactId } });
    if (!contact) {
      throw new NotFoundException(`Group Contact with ID "${contactId}" not found`);
    }

    if (updateContactDto.isPrimary) {
      await this.groupContactRepository.update({ clientGroupId: contact.clientGroupId }, { isPrimary: false });
    }

    Object.assign(contact, updateContactDto);
    if (user?.id) {
      contact.updatedBy = user.id;
    }

    return this.groupContactRepository.save(contact);
  }

  async removeContact(contactId: string): Promise<{ message: string }> {
    const contact = await this.groupContactRepository.findOne({ where: { id: contactId } });
    if (!contact) {
      throw new NotFoundException(`Group Contact with ID "${contactId}" not found`);
    }

    await this.groupContactRepository.remove(contact);
    return { message: 'Contact deleted successfully' };
  }

  // --- Assign / Unassign Customers to Group ---

  async assignClients(groupId: string, clientIds: string[]): Promise<{ message: string; count: number }> {
    const group = await this.clientGroupRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Client Group with ID "${groupId}" not found`);
    }

    if (!clientIds || clientIds.length === 0) {
      return { message: 'No clients provided', count: 0 };
    }

    await this.customerRepository.update(
      { id: In(clientIds) },
      { clientGroupId: groupId }
    );

    return { message: `${clientIds.length} client(s) assigned to ${group.name}`, count: clientIds.length };
  }

  async unassignClient(clientId: string): Promise<{ message: string }> {
    await this.customerRepository.update({ id: clientId }, { clientGroupId: null });
    return { message: 'Client removed from group' };
  }

  // --- Group-wise Ledger & Consolidated Analytics ---

  async getGroupLedger(groupId: string): Promise<any> {
    const group = await this.clientGroupRepository.findOne({
      where: { id: groupId },
      relations: ['partnerInCharge', 'contacts']
    });

    if (!group) {
      throw new NotFoundException(`Client Group with ID "${groupId}" not found`);
    }

    // Get all member customers
    const members = await this.customerRepository.find({
      where: { clientGroupId: groupId },
      relations: ['businessSize', 'industryNature', 'legalStatus'],
      order: { name: 'ASC' }
    });

    const memberIds = members.map((m) => m.id);

    let projects: Project[] = [];
    if (memberIds.length > 0) {
      projects = await this.projectRepository.find({
        where: { customer: { id: In(memberIds) } },
        relations: ['customer', 'projectManager', 'projectLead', 'workingYear'],
        order: { createdAt: 'DESC' }
      });
    }

    // Aggregate entity stats
    const entityBreakdown = members.map((m) => {
      const entityProjects = projects.filter((p) => p.customer?.id === m.id);
      const activeProjects = entityProjects.filter((p) => p.status === 'active');
      const completedProjects = entityProjects.filter((p) => p.status === 'completed' || p.status === 'signed_off');

      return {
        id: m.id,
        name: m.name,
        shortName: m.shortName,
        panNo: m.panNo,
        status: m.status,
        totalProjects: entityProjects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        contactPerson: m.mobileNo || m.telephoneNo || m.email || '-'
      };
    });

    return {
      group: {
        id: group.id,
        name: group.name,
        code: group.code,
        partnerInCharge: group.partnerInCharge,
        primaryContactPerson: group.primaryContactPerson,
        primaryPhone: group.primaryPhone,
        primaryEmail: group.primaryEmail,
        headOfficeAddress: group.headOfficeAddress,
        contacts: group.contacts
      },
      summary: {
        totalEntities: members.length,
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === 'active').length,
        completedProjects: projects.filter((p) => p.status === 'completed' || p.status === 'signed_off').length,
        suspendedProjects: projects.filter((p) => p.status === 'suspended').length
      },
      entityBreakdown,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        fiscalYear: p.fiscalYear,
        workingYear: p.workingYear?.name,
        customer: { id: p.customer?.id, name: p.customer?.name, shortName: p.customer?.shortName },
        projectManager: p.projectManager ? { id: p.projectManager.id, name: p.projectManager.name } : null,
        projectLead: p.projectLead ? { id: p.projectLead.id, name: p.projectLead.name } : null,
        startingDate: p.startingDate,
        createdAt: p.createdAt
      }))
    };
  }
}
