import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BoardMemberInputDto, CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateClientTimelineDto } from './dto/client-timeline.dto';
import { CreateLicenseDto, UpdateLicenseDto } from './dto/license.dto';
import { CreateOtherInfoDto, UpdateOtherInfoDto } from './dto/other-info.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { BusinessSize } from 'src/business-size/entities/business-size.entity';
import { BusinessNature } from 'src/business-nature/entities/business-nature.entity';
import { LegalStatus } from 'src/legal-status/entities/legal-status.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { ClientGroup } from 'src/client-groups/entities/client-group.entity';
import { PortalCredential } from './entities/portal-credential.entity';
import { BoardMember } from './entities/board-member.entity';
import { ClientTimeline } from './entities/client-timeline.entity';
import { RegistrationAndLicense } from './entities/registration-and-license.entity';
import { OtherImportantInfo } from './entities/other-important-info.entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/enums/notification-type.enum';
import { FuzzyMatcher } from './utils/fuzzy-matcher.util';
import { isAdminOrSuperUser } from './utils/role-access.util';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

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
    private clientGroupRepository: Repository<ClientGroup>,
    @InjectRepository(PortalCredential)
    private portalCredentialRepository: Repository<PortalCredential>,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
    @InjectRepository(ClientTimeline)
    private timelineRepository: Repository<ClientTimeline>,
    @InjectRepository(RegistrationAndLicense)
    private licenseRepository: Repository<RegistrationAndLicense>,
    @InjectRepository(OtherImportantInfo)
    private otherInfoRepository: Repository<OtherImportantInfo>,
    private readonly notificationService: NotificationService
  ) {}

  private async logTimeline({
    customerId,
    user,
    eventType,
    title,
    details,
    eventDate,
    isManual = false,
  }: {
    customerId: string;
    user?: UserEntity | null;
    eventType: string;
    title: string;
    details?: string;
    eventDate?: Date | string;
    isManual?: boolean;
  }) {
    const parsedDate = eventDate ? new Date(eventDate) : new Date();
    const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    const entry = this.timelineRepository.create({
      customerId,
      userId: user?.id || null,
      eventType,
      title,
      details: details || null,
      eventDate: validDate,
      isManual,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
    });
    return this.timelineRepository.save(entry);
  }

  async create(createCustomerDto: CreateCustomerDto, user?: UserEntity) {
    const { portalCredentials, boardMembers, effectiveDate, ...dtoRest } = createCustomerDto;

    // Sanitize input
    const name = dtoRest.name ? dtoRest.name.trim().replace(/\s+/g, ' ') : '';
    const panNo = dtoRest.panNo ? dtoRest.panNo.trim() : '';

    let shortName = dtoRest.shortName?.trim();
    if (!shortName && name) {
      const suggestions = FuzzyMatcher.generateShortNameSuggestions(name);
      shortName = suggestions[0] || name.slice(0, 10).toUpperCase();
    }

    const customer = this.customerRepository.create({
      ...dtoRest,
      name,
      panNo,
      shortName,
      status: dtoRest.status || 'active',
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
    
    const savedCustomer = await this.customerRepository.save(customer);

    // Save initial Board Members if supplied
    if (Array.isArray(boardMembers) && boardMembers.length > 0) {
      const validMembers = boardMembers.filter(
        (m) => m && m.name?.trim() && m.designation?.trim()
      );
      if (validMembers.length > 0) {
        const memberEntities = validMembers.map((m) =>
          this.boardMemberRepository.create({
            name: m.name.trim(),
            designation: m.designation.trim(),
            mobileNo: m.mobileNo?.trim() || null,
            telephoneNo: m.telephoneNo?.trim() || null,
            email: m.email?.trim() || null,
            extNo: m.extNo?.trim() || null,
            isContactPerson: Boolean(m.isContactPerson),
            appointedDate: m.appointedDate ? new Date(m.appointedDate) : null,
            resignedDate: m.resignedDate ? new Date(m.resignedDate) : null,
            isActive: m.isActive !== undefined ? m.isActive : true,
            customer: savedCustomer,
            createdBy: user?.id || null,
            updatedBy: user?.id || null,
          })
        );
        const savedMembers = await this.boardMemberRepository.save(memberEntities);

        // If one board member was designated as Contact Person, sync contactPerson fields on Customer
        const contactBoardMember = savedMembers.find((m) => m.isContactPerson);
        if (contactBoardMember) {
          savedCustomer.contactPerson = contactBoardMember.name;
          savedCustomer.contactPersonDesignation = contactBoardMember.designation;
          savedCustomer.contactPersonPhone =
            contactBoardMember.mobileNo || contactBoardMember.telephoneNo || savedCustomer.contactPersonPhone;
          savedCustomer.contactPersonEmail =
            contactBoardMember.email || savedCustomer.contactPersonEmail;
          savedCustomer.contactPersonBoardMemberId = contactBoardMember.id;
          await this.customerRepository.save(savedCustomer);
        }

        // Log board member appointment events on timeline
        for (const m of savedMembers) {
          await this.logTimeline({
            customerId: savedCustomer.id,
            user,
            eventType: 'board_change',
            title: `Board Member Appointed: ${m.name}`,
            details: `${m.name} appointed as ${m.designation}${m.isContactPerson ? ' (Primary Contact Person)' : ''}.`,
            eventDate: m.appointedDate || effectiveDate || new Date(),
          });
        }
      }
    }

    // Create initial portal credentials only if user is Super Admin or Administrator
    if (
      isAdminOrSuperUser(user) &&
      Array.isArray(portalCredentials) &&
      portalCredentials.length > 0
    ) {
      const validCreds = portalCredentials.filter(
        (c) => c && c.portalName && c.loginUser && c.password
      );
      if (validCreds.length > 0) {
        const entities = validCreds.map((c) =>
          this.portalCredentialRepository.create({
            ...c,
            status: c.status || 'active',
            customer: savedCustomer,
          })
        );
        await this.portalCredentialRepository.save(entities);
      }
    }

    // Log creation and/or past registration milestone
    await this.logTimeline({
      customerId: savedCustomer.id,
      user,
      eventType: 'client_created',
      title: 'Client Profile Created',
      details: `${savedCustomer.name} (PAN: ${savedCustomer.panNo}) added to Artha.`,
      eventDate: effectiveDate || new Date(),
    });

    if (dtoRest.registeredDate) {
      const regDate = new Date(dtoRest.registeredDate);
      const today = new Date();
      if (!isNaN(regDate.getTime()) && regDate.toDateString() !== today.toDateString()) {
        await this.logTimeline({
          customerId: savedCustomer.id,
          user,
          eventType: 'company_registered',
          title: 'Entity Registered / Incorporated',
          details: `${savedCustomer.name} officially registered.`,
          eventDate: regDate,
        });
      }
    }

    return savedCustomer;
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

  async findOne(id: string, user?: UserEntity) {
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
        'otherImportantInfos',
        'portalCredentials'
      ]
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Restrict Portal & IRD Credentials strictly to Super Admin and Administrator
    if (user && !isAdminOrSuperUser(user)) {
      customer.portalCredentials = [];
      delete (customer as any).loginUser;
      delete (customer as any).password;
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
    const {
      portalCredentials,
      boardMembers,
      effectiveDate,
      ...dtoFields
    } = updateCustomerDto as any;

    const prevSnapshot = {
      name: customer.name,
      shortName: customer.shortName,
      panNo: customer.panNo,
      status: customer.status,
      contactPerson: customer.contactPerson,
      locality: customer.locality,
      district: customer.district,
      bankName: customer.bankName,
      bankAccountNumber: customer.bankAccountNumber,
      about: customer.about,
      partnerInChargeId: customer.partnerInChargeId,
      clientGroupId: customer.clientGroupId,
    };

    // Handle business size reference if provided
    if (dtoFields.businessSizeId !== undefined) {
      if (dtoFields.businessSizeId) {
        const businessSize = await this.businessSizeRepository.findOne({ 
          where: { id: dtoFields.businessSizeId } 
        });
        customer.businessSize = businessSize || null;
      } else {
        customer.businessSize = null;
      }
      delete dtoFields.businessSizeId;
    }
    
    // Handle industry nature reference if provided
    if (dtoFields.industryNatureId !== undefined) {
      if (dtoFields.industryNatureId) {
        const businessNature = await this.businessNatureRepository.findOne({ 
          where: { id: dtoFields.industryNatureId } 
        });
        customer.industryNature = businessNature || null;
      } else {
        customer.industryNature = null;
      }
      delete dtoFields.industryNatureId;
    }
    
    // Handle legal status reference if provided
    if (dtoFields.legalStatusId !== undefined) {
      if (dtoFields.legalStatusId) {
        const legalStatus = await this.legalStatusRepository.findOne({ 
          where: { id: dtoFields.legalStatusId } 
        });
        customer.legalStatus = legalStatus || null;
      } else {
        customer.legalStatus = null;
      }
      delete dtoFields.legalStatusId;
    }

    // Handle client group reference
    if (dtoFields.clientGroupId !== undefined) {
      if (dtoFields.clientGroupId) {
        const group = await this.clientGroupRepository.findOne({
          where: { id: dtoFields.clientGroupId }
        });
        customer.clientGroup = group || null;
        customer.clientGroupId = group ? group.id : null;
      } else {
        customer.clientGroup = null;
        customer.clientGroupId = null;
      }
      delete dtoFields.clientGroupId;
    }

    // Handle partner in charge
    if (dtoFields.partnerInChargeId !== undefined) {
      if (dtoFields.partnerInChargeId) {
        const partner = await this.userRepository.findOne({
          where: { id: dtoFields.partnerInChargeId }
        });
        customer.partnerInCharge = partner || null;
        customer.partnerInChargeId = partner ? partner.id : null;
      } else {
        customer.partnerInCharge = null;
        customer.partnerInChargeId = null;
      }
      delete dtoFields.partnerInChargeId;
    }

    // Sanitize string fields
    if (dtoFields.name) {
      dtoFields.name = dtoFields.name.trim().replace(/\s+/g, ' ');
    }
    if (dtoFields.panNo) {
      dtoFields.panNo = dtoFields.panNo.trim();
    }
    if (dtoFields.shortName) {
      dtoFields.shortName = dtoFields.shortName.trim();
    }

    Object.assign(customer, dtoFields);
    if (user?.id) {
      customer.updatedBy = user.id;
    }

    const changeEventDate = effectiveDate ? new Date(effectiveDate) : new Date();

    // Reconcile Board Members if included in payload
    if (Array.isArray(boardMembers)) {
      const existingMembers = await this.boardMemberRepository.find({
        where: { customer: { id: customer.id } },
      });
      const existingMap = new Map(existingMembers.map((m) => [m.id, m]));
      const incomingIds = new Set<string>();
      const validIncoming = boardMembers.filter(
        (m: BoardMemberInputDto) => m && m.name?.trim() && m.designation?.trim()
      );

      const savedMembers: BoardMember[] = [];
      for (const m of validIncoming) {
        if (m.id && existingMap.has(m.id)) {
          incomingIds.add(m.id);
          const existing = existingMap.get(m.id)!;
          const prevDesignation = existing.designation;
          const prevActive = existing.isActive;

          existing.name = m.name.trim();
          existing.designation = m.designation.trim();
          existing.mobileNo = m.mobileNo?.trim() || null;
          existing.telephoneNo = m.telephoneNo?.trim() || null;
          existing.email = m.email?.trim() || null;
          existing.extNo = m.extNo?.trim() || null;
          existing.isContactPerson = Boolean(m.isContactPerson);
          existing.appointedDate = m.appointedDate ? new Date(m.appointedDate) : existing.appointedDate;
          existing.resignedDate = m.resignedDate ? new Date(m.resignedDate) : existing.resignedDate;
          existing.isActive = m.isActive !== undefined ? m.isActive : true;
          existing.updatedBy = user?.id || null;

          const updatedMember = await this.boardMemberRepository.save(existing);
          savedMembers.push(updatedMember);

          if (prevActive && updatedMember.isActive === false) {
            await this.logTimeline({
              customerId: customer.id,
              user,
              eventType: 'board_change',
              title: `Board Member Stepped Down: ${updatedMember.name}`,
              details: `${updatedMember.name} (${updatedMember.designation}) marked as resigned/inactive.`,
              eventDate: updatedMember.resignedDate || changeEventDate,
            });
          } else if (prevDesignation !== updatedMember.designation) {
            await this.logTimeline({
              customerId: customer.id,
              user,
              eventType: 'board_change',
              title: `Board Designation Updated: ${updatedMember.name}`,
              details: `Designation changed from ${prevDesignation} to ${updatedMember.designation}.`,
              eventDate: changeEventDate,
            });
          }
        } else {
          const newMember = this.boardMemberRepository.create({
            name: m.name.trim(),
            designation: m.designation.trim(),
            mobileNo: m.mobileNo?.trim() || null,
            telephoneNo: m.telephoneNo?.trim() || null,
            email: m.email?.trim() || null,
            extNo: m.extNo?.trim() || null,
            isContactPerson: Boolean(m.isContactPerson),
            appointedDate: m.appointedDate ? new Date(m.appointedDate) : null,
            resignedDate: m.resignedDate ? new Date(m.resignedDate) : null,
            isActive: m.isActive !== undefined ? m.isActive : true,
            customer,
            createdBy: user?.id || null,
            updatedBy: user?.id || null,
          });
          const createdMember = await this.boardMemberRepository.save(newMember);
          savedMembers.push(createdMember);

          await this.logTimeline({
            customerId: customer.id,
            user,
            eventType: 'board_change',
            title: `Board Member Appointed: ${createdMember.name}`,
            details: `${createdMember.name} added as ${createdMember.designation}${createdMember.isContactPerson ? ' (Primary Contact Person)' : ''}.`,
            eventDate: createdMember.appointedDate || changeEventDate,
          });
        }
      }

      // Remove deleted board members
      for (const oldMember of existingMembers) {
        if (!incomingIds.has(oldMember.id)) {
          await this.boardMemberRepository.remove(oldMember);
          await this.logTimeline({
            customerId: customer.id,
            user,
            eventType: 'board_change',
            title: `Board Member Removed: ${oldMember.name}`,
            details: `${oldMember.name} (${oldMember.designation}) removed from board records.`,
            eventDate: changeEventDate,
          });
        }
      }

      const contactBoardMember = savedMembers.find((m) => m.isContactPerson);
      if (contactBoardMember) {
        customer.contactPerson = contactBoardMember.name;
        customer.contactPersonDesignation = contactBoardMember.designation;
        customer.contactPersonPhone =
          contactBoardMember.mobileNo || contactBoardMember.telephoneNo || customer.contactPersonPhone;
        customer.contactPersonEmail =
          contactBoardMember.email || customer.contactPersonEmail;
        customer.contactPersonBoardMemberId = contactBoardMember.id;
      }
    }

    const saved = await this.customerRepository.save(customer);

    // Log company record change on timeline if meaningful fields changed or edit reason provided
    const changedFields: string[] = [];
    if (prevSnapshot.name !== saved.name) changedFields.push(`Legal Name -> "${saved.name}"`);
    if (prevSnapshot.shortName !== saved.shortName) changedFields.push(`Short Name -> "${saved.shortName}"`);
    if (prevSnapshot.panNo !== saved.panNo) changedFields.push(`PAN -> ${saved.panNo}`);
    if (prevSnapshot.status !== saved.status) changedFields.push(`Status -> ${saved.status}`);
    if (prevSnapshot.contactPerson !== saved.contactPerson) changedFields.push(`Contact Person -> ${saved.contactPerson || 'Cleared'}`);
    if (prevSnapshot.locality !== saved.locality || prevSnapshot.district !== saved.district) {
      changedFields.push(`Address updated`);
    }
    if (prevSnapshot.bankName !== saved.bankName || prevSnapshot.bankAccountNumber !== saved.bankAccountNumber) {
      changedFields.push(`Banking details updated`);
    }
    if (prevSnapshot.about !== saved.about) changedFields.push(`Company overview updated`);
    if (prevSnapshot.partnerInChargeId !== saved.partnerInChargeId) changedFields.push(`Partner in charge updated`);
    if (prevSnapshot.clientGroupId !== saved.clientGroupId) changedFields.push(`Client group updated`);

    if (changedFields.length > 0 || dtoFields.lastEditReason) {
      const summaryParts = [];
      if (changedFields.length > 0) summaryParts.push(changedFields.join(', '));
      if (dtoFields.lastEditReason) summaryParts.push(`Note: ${dtoFields.lastEditReason}`);

      await this.logTimeline({
        customerId: saved.id,
        user,
        eventType: 'company_update',
        title: 'Company Record Updated',
        details: summaryParts.join(' — '),
        eventDate: changeEventDate,
      });
    }

    return saved;
  }

  // --- Client Timeline & Historical Records ---

  async getTimeline(customerId: string) {
    return this.timelineRepository.find({
      where: { customerId },
      relations: ['user'],
      order: { eventDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async addTimelineEvent(
    customerId: string,
    dto: CreateClientTimelineDto,
    user?: UserEntity
  ) {
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return this.logTimeline({
      customerId,
      user,
      eventType: dto.eventType || 'milestone',
      title: dto.title.trim(),
      details: dto.details?.trim(),
      eventDate: dto.eventDate || new Date(),
      isManual: true,
    });
  }

  async deleteTimelineEvent(customerId: string, eventId: string) {
    const event = await this.timelineRepository.findOne({
      where: { id: eventId, customerId },
    });
    if (!event) {
      throw new NotFoundException(`Timeline event with ID ${eventId} not found`);
    }
    await this.timelineRepository.remove(event);
    return { id: eventId };
  }

  async addBoardMember(
    customerId: string,
    dto: BoardMemberInputDto,
    user?: UserEntity
  ) {
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    if (dto.isContactPerson) {
      await this.boardMemberRepository.update(
        { customer: { id: customerId } },
        { isContactPerson: false }
      );
    }

    const member = this.boardMemberRepository.create({
      name: dto.name.trim(),
      designation: dto.designation.trim(),
      mobileNo: dto.mobileNo?.trim() || null,
      telephoneNo: dto.telephoneNo?.trim() || null,
      email: dto.email?.trim() || null,
      extNo: dto.extNo?.trim() || null,
      isContactPerson: Boolean(dto.isContactPerson),
      appointedDate: dto.appointedDate ? new Date(dto.appointedDate) : null,
      resignedDate: dto.resignedDate ? new Date(dto.resignedDate) : null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      customer,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
    });

    const savedMember = await this.boardMemberRepository.save(member);

    if (savedMember.isContactPerson) {
      customer.contactPerson = savedMember.name;
      customer.contactPersonDesignation = savedMember.designation;
      customer.contactPersonPhone = savedMember.mobileNo || savedMember.telephoneNo || customer.contactPersonPhone;
      customer.contactPersonEmail = savedMember.email || customer.contactPersonEmail;
      customer.contactPersonBoardMemberId = savedMember.id;
      await this.customerRepository.save(customer);
    }

    await this.logTimeline({
      customerId,
      user,
      eventType: 'board_change',
      title: `Board Member Appointed: ${savedMember.name}`,
      details: `${savedMember.name} appointed as ${savedMember.designation}${savedMember.isContactPerson ? ' (Primary Contact Person)' : ''}.`,
      eventDate: savedMember.appointedDate || new Date(),
    });

    return savedMember;
  }

  // --- Licenses & Automated Renewal Reminders ---

  async getLicenses(customerId: string) {
    return this.licenseRepository.find({
      where: { customer: { id: customerId } },
      order: { validDate: 'ASC', createdAt: 'DESC' },
    });
  }

  async addLicense(customerId: string, dto: CreateLicenseDto, user?: UserEntity) {
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const license = this.licenseRepository.create({
      statutoryAuthority: dto.statutoryAuthority.trim(),
      registrationLicenseNo: dto.registrationLicenseNo?.trim() || null,
      dateOfIssue: dto.dateOfIssue ? new Date(dto.dateOfIssue) : null,
      validDate: dto.validDate ? new Date(dto.validDate) : null,
      frequencyOfRenewal: dto.frequencyOfRenewal || null,
      reminderDaysBefore: dto.reminderDaysBefore ?? 30,
      notes: dto.notes?.trim() || null,
      customer,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
    });

    const saved = await this.licenseRepository.save(license);

    await this.logTimeline({
      customerId,
      user,
      eventType: 'license_change',
      title: `License Added: ${saved.statutoryAuthority}`,
      details: `${saved.statutoryAuthority}${saved.registrationLicenseNo ? ` (No: ${saved.registrationLicenseNo})` : ''}${saved.validDate ? ` — Valid until ${new Date(saved.validDate).toISOString().slice(0, 10)}` : ''}.`,
      eventDate: saved.dateOfIssue || new Date(),
    });

    return saved;
  }

  async updateLicense(
    customerId: string,
    licenseId: string,
    dto: UpdateLicenseDto,
    user?: UserEntity
  ) {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId, customer: { id: customerId } },
    });
    if (!license) {
      throw new NotFoundException(`License with ID ${licenseId} not found`);
    }

    license.statutoryAuthority = dto.statutoryAuthority.trim();
    license.registrationLicenseNo = dto.registrationLicenseNo?.trim() || null;
    license.dateOfIssue = dto.dateOfIssue ? new Date(dto.dateOfIssue) : null;
    license.validDate = dto.validDate ? new Date(dto.validDate) : null;
    license.frequencyOfRenewal = dto.frequencyOfRenewal || null;
    license.reminderDaysBefore = dto.reminderDaysBefore ?? license.reminderDaysBefore ?? 30;
    license.notes = dto.notes?.trim() || null;
    license.lastRemindedAt = null; // Reset reminder cycle if updated/renewed
    license.updatedBy = user?.id || null;

    const saved = await this.licenseRepository.save(license);

    await this.logTimeline({
      customerId,
      user,
      eventType: 'license_change',
      title: `License Renewed / Updated: ${saved.statutoryAuthority}`,
      details: `${saved.statutoryAuthority}${saved.registrationLicenseNo ? ` (No: ${saved.registrationLicenseNo})` : ''}${saved.validDate ? ` — Valid until ${new Date(saved.validDate).toISOString().slice(0, 10)}` : ''}.`,
      eventDate: new Date(),
    });

    return saved;
  }

  async deleteLicense(customerId: string, licenseId: string) {
    const license = await this.licenseRepository.findOne({
      where: { id: licenseId, customer: { id: customerId } },
    });
    if (!license) {
      throw new NotFoundException(`License with ID ${licenseId} not found`);
    }
    await this.licenseRepository.remove(license);
    return { id: licenseId };
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkLicenseRenewalReminders() {
    try {
      const licenses = await this.licenseRepository.find({
        where: { validDate: Not(IsNull()) },
        relations: ['customer'],
      });

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      for (const lic of licenses) {
        if (!lic.customer || !lic.validDate) continue;
        if (lic.frequencyOfRenewal === 'renewal_not_required') continue;
        if (lic.lastRemindedAt && new Date(lic.lastRemindedAt) > sevenDaysAgo) continue;

        const validDate = new Date(lic.validDate);
        const daysLeft = Math.ceil((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const threshold = lic.reminderDaysBefore ?? 30;

        if (daysLeft <= threshold) {
          const targetUserIds: string[] = [];
          if (lic.customer.partnerInChargeId) {
            targetUserIds.push(lic.customer.partnerInChargeId);
          }

          if (targetUserIds.length === 0) {
            const admins = await this.userRepository
              .createQueryBuilder('u')
              .leftJoin('u.role', 'r')
              .where('LOWER(r.name) IN (:...roles)', {
                roles: ['superuser', 'administrator', 'admin'],
              })
              .select(['u.id'])
              .getMany();
            admins.forEach((a) => targetUserIds.push(a.id));
          }

          if (targetUserIds.length > 0) {
            const statusText =
              daysLeft < 0
                ? `expired ${Math.abs(daysLeft)} day(s) ago`
                : daysLeft === 0
                ? 'expires today'
                : `expires in ${daysLeft} day(s)`;

            await this.notificationService.create({
              message: `License renewal reminder: ${lic.customer.name} — ${lic.statutoryAuthority} (${lic.registrationLicenseNo || 'N/A'}) ${statusText}.`,
              link: `/client/view/${lic.customer.id}`,
              type: NotificationType.CLIENT,
              users: targetUserIds,
              metadata: {
                customerId: lic.customer.id,
                licenseId: lic.id,
                validDate: validDate.toISOString().slice(0, 10),
              },
            });

            lic.lastRemindedAt = now;
            await this.licenseRepository.save(lic);
          }
        }
      }
    } catch (err) {
      this.logger.error(`License renewal reminder cron failed: ${err.message}`);
    }
  }

  // --- Other Important Information ---

  async getOtherInfo(customerId: string) {
    return this.otherInfoRepository.find({
      where: { customer: { id: customerId } },
      order: { createdAt: 'DESC' },
    });
  }

  async addOtherInfo(customerId: string, dto: CreateOtherInfoDto, user?: UserEntity) {
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const info = this.otherInfoRepository.create({
      particular: dto.particular.trim(),
      description: dto.description?.trim() || null,
      attachment: dto.attachment?.trim() || null,
      customer,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
    });

    return this.otherInfoRepository.save(info);
  }

  async updateOtherInfo(
    customerId: string,
    infoId: string,
    dto: UpdateOtherInfoDto,
    user?: UserEntity
  ) {
    const info = await this.otherInfoRepository.findOne({
      where: { id: infoId, customer: { id: customerId } },
    });
    if (!info) {
      throw new NotFoundException(`Record with ID ${infoId} not found`);
    }

    info.particular = dto.particular.trim();
    info.description = dto.description?.trim() || null;
    if (dto.attachment !== undefined) {
      info.attachment = dto.attachment?.trim() || null;
    }
    info.updatedBy = user?.id || null;

    return this.otherInfoRepository.save(info);
  }

  async deleteOtherInfo(customerId: string, infoId: string) {
    const info = await this.otherInfoRepository.findOne({
      where: { id: infoId, customer: { id: customerId } },
    });
    if (!info) {
      throw new NotFoundException(`Record with ID ${infoId} not found`);
    }
    await this.otherInfoRepository.remove(info);
    return { id: infoId };
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
