import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { UserStatusEnum } from 'src/auth/user-status.enum';
import { Customer } from 'src/customers/entities/customer.entity';
import { Project } from 'src/projects/entities/project.entity';
import { ProjectUserAssignment } from 'src/projects/entities/project-user-assignment.entity';
import { RoleEntity } from 'src/role/entities/role.entity';
import { WorkingYearService } from 'src/working-year/working-year.service';
import { CreatePhonebookCategoryDto } from './dto/create-category.dto';
import { CreatePhonebookDto } from './dto/create-phonebook.dto';
import { UpdatePhonebookDto } from './dto/update-phonebook.dto';
import { PhonebookCategory } from './entities/phonebook-category.entity';
import { PhonebookEntry } from './entities/phonebook-entry.entity';
import {
  PhonebookFieldChange,
  PhonebookHistory
} from './entities/phonebook-history.entity';

const MANAGER_AND_ABOVE_ROLES = new Set([
  'superuser',
  'administrator',
  'admin',
  'manager',
  'projectmanager'
]);

@Injectable()
export class PhonebookService {
  constructor(
    @InjectRepository(PhonebookEntry)
    private readonly entryRepo: Repository<PhonebookEntry>,
    @InjectRepository(PhonebookCategory)
    private readonly categoryRepo: Repository<PhonebookCategory>,
    @InjectRepository(PhonebookHistory)
    private readonly historyRepo: Repository<PhonebookHistory>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectUserAssignment)
    private readonly assignmentRepo: Repository<ProjectUserAssignment>,
    private readonly workingYearService: WorkingYearService
  ) {}

  private isSuperUser(user?: UserEntity | null): boolean {
    const roleName = (user?.role?.name || '').toLowerCase().trim();
    return roleName === 'superuser';
  }

  private isAdminOrSuperUser(user?: UserEntity | null): boolean {
    const roleName = (user?.role?.name || '').toLowerCase().trim();
    return [
      'superuser',
      'super_user',
      'superadmin',
      'super admin',
      'administrator',
      'admin'
    ].includes(roleName);
  }

  private isManagerOrAbove(user?: UserEntity | null): boolean {
    const roleName = (user?.role?.name || '').toLowerCase().trim();
    return MANAGER_AND_ABOVE_ROLES.has(roleName);
  }

  private sanitizeUser(user?: UserEntity | null) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
            displayName: user.role.displayName
          }
        : undefined
    };
  }

  private serializeEntry(entry: PhonebookEntry) {
    return {
      id: entry.id,
      name: entry.name,
      phoneNumber: entry.phoneNumber,
      secondaryPhone: entry.secondaryPhone,
      notes: entry.notes,
      categoryId: entry.categoryId,
      category: entry.category
        ? {
            id: entry.category.id,
            name: entry.category.name
          }
        : null,
      isShared: entry.isShared,
      sharedWithUsers: (entry.sharedWithUsers || []).map((u) =>
        this.sanitizeUser(u)
      ),
      sharedWithRoles: (entry.sharedWithRoles || []).map((r) => ({
        id: r.id,
        name: r.name,
        displayName: r.displayName
      })),
      createdBy: entry.createdBy,
      updatedBy: entry.updatedBy,
      creator: this.sanitizeUser(entry.creator),
      updater: this.sanitizeUser(entry.updater),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    };
  }

  async getShareOptions() {
    const [users, roles] = await Promise.all([
      this.userRepo.find({
        where: { status: UserStatusEnum.ACTIVE },
        relations: ['role'],
        order: { name: 'ASC' }
      }),
      this.roleRepo.find({
        order: { displayName: 'ASC' }
      })
    ]);

    return {
      users: users.map((u) => this.sanitizeUser(u)),
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        displayName: r.displayName || r.name
      }))
    };
  }

  async getCategories() {
    return this.categoryRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async createCategory(dto: CreatePhonebookCategoryDto, user: UserEntity) {
    if (!this.isAdminOrSuperUser(user)) {
      throw new ForbiddenException(
        'Only Admin or Super User is allowed to add phonebook categories'
      );
    }

    const trimmedName = dto.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Category name is required');
    }

    const existing = await this.categoryRepo
      .createQueryBuilder('cat')
      .where('LOWER(cat.name) = LOWER(:name)', { name: trimmedName })
      .getOne();

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.updatedBy = user.id;
        return this.categoryRepo.save(existing);
      }
      throw new BadRequestException(`Category "${trimmedName}" already exists`);
    }

    const category = this.categoryRepo.create({
      name: trimmedName,
      description: dto.description?.trim(),
      isActive: true,
      createdBy: user.id,
      updatedBy: user.id
    });

    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: string, user: UserEntity) {
    if (!this.isSuperUser(user)) {
      throw new ForbiddenException(
        'Only Super User is allowed to delete phonebook categories'
      );
    }

    const existing = await this.categoryRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Phonebook category not found');
    }

    await this.categoryRepo.remove(existing);
    return { message: 'Phonebook category deleted successfully' };
  }

  async findAllEntries(user: UserEntity) {
    const entries = await this.entryRepo.find({
      relations: [
        'category',
        'sharedWithUsers',
        'sharedWithRoles',
        'creator',
        'updater'
      ],
      order: { updatedAt: 'DESC', createdAt: 'DESC' }
    });

    const isSuper = this.isSuperUser(user);
    const userRoleId = user?.role?.id;

    const visibleEntries = isSuper
      ? entries
      : entries.filter((entry) => {
          if (entry.createdBy === user.id) {
            return true;
          }
          if (!entry.isShared) {
            return false;
          }
          const sharedUsers = entry.sharedWithUsers || [];
          const sharedRoles = entry.sharedWithRoles || [];
          if (sharedUsers.length === 0 && sharedRoles.length === 0) {
            return true;
          }
          const matchesUser = sharedUsers.some((u) => u.id === user.id);
          const matchesRole =
            !!userRoleId && sharedRoles.some((r) => r.id === userRoleId);
          return matchesUser || matchesRole;
        });

    return visibleEntries.map((e) => this.serializeEntry(e));
  }

  async createEntry(dto: CreatePhonebookDto, user: UserEntity) {
    if (dto.categoryId) {
      const cat = await this.categoryRepo.findOne({
        where: { id: dto.categoryId }
      });
      if (!cat) {
        throw new NotFoundException('Selected category not found');
      }
    }

    const sharedWithUsers =
      dto.sharedWithUserIds && dto.sharedWithUserIds.length > 0
        ? await this.userRepo.find({ where: { id: In(dto.sharedWithUserIds) } })
        : [];

    const sharedWithRoles =
      dto.sharedWithRoleIds && dto.sharedWithRoleIds.length > 0
        ? await this.roleRepo.find({ where: { id: In(dto.sharedWithRoleIds) } })
        : [];

    const entry = this.entryRepo.create({
      name: dto.name.trim(),
      phoneNumber: dto.phoneNumber.trim(),
      secondaryPhone: dto.secondaryPhone?.trim() || null,
      notes: dto.notes?.trim() || null,
      categoryId: dto.categoryId || null,
      isShared: dto.isShared !== undefined ? dto.isShared : true,
      sharedWithUsers,
      sharedWithRoles,
      createdBy: user.id,
      updatedBy: user.id
    });

    const saved = await this.entryRepo.save(entry);

    await this.historyRepo.save(
      this.historyRepo.create({
        entryId: saved.id,
        action: 'created',
        editedById: user.id,
        createdBy: user.id,
        updatedBy: user.id,
        changes: [
          {
            field: 'name',
            label: 'Name',
            oldValue: null,
            newValue: saved.name
          },
          {
            field: 'phoneNumber',
            label: 'Phone Number',
            oldValue: null,
            newValue: saved.phoneNumber
          }
        ]
      })
    );

    const fullEntry = await this.entryRepo.findOne({
      where: { id: saved.id },
      relations: [
        'category',
        'sharedWithUsers',
        'sharedWithRoles',
        'creator',
        'updater'
      ]
    });

    return this.serializeEntry(fullEntry);
  }

  async updateEntry(id: string, dto: UpdatePhonebookDto, user: UserEntity) {
    const existing = await this.entryRepo.findOne({
      where: { id },
      relations: [
        'category',
        'sharedWithUsers',
        'sharedWithRoles',
        'creator',
        'updater'
      ]
    });

    if (!existing) {
      throw new NotFoundException('Phonebook entry not found');
    }

    if (existing.createdBy !== user.id && !this.isSuperUser(user)) {
      throw new ForbiddenException(
        'Only the creator of this number can edit it'
      );
    }

    const changes: PhonebookFieldChange[] = [];

    if (dto.name !== undefined && dto.name.trim() !== existing.name) {
      changes.push({
        field: 'name',
        label: 'Name',
        oldValue: existing.name,
        newValue: dto.name.trim()
      });
      existing.name = dto.name.trim();
    }

    if (
      dto.phoneNumber !== undefined &&
      dto.phoneNumber.trim() !== existing.phoneNumber
    ) {
      changes.push({
        field: 'phoneNumber',
        label: 'Phone Number',
        oldValue: existing.phoneNumber,
        newValue: dto.phoneNumber.trim()
      });
      existing.phoneNumber = dto.phoneNumber.trim();
    }

    if (dto.secondaryPhone !== undefined) {
      const nextSec = dto.secondaryPhone?.trim() || null;
      if (nextSec !== (existing.secondaryPhone || null)) {
        changes.push({
          field: 'secondaryPhone',
          label: 'Secondary Phone',
          oldValue: existing.secondaryPhone || null,
          newValue: nextSec
        });
        existing.secondaryPhone = nextSec;
      }
    }

    if (dto.notes !== undefined) {
      const nextNotes = dto.notes?.trim() || null;
      if (nextNotes !== (existing.notes || null)) {
        changes.push({
          field: 'notes',
          label: 'Notes',
          oldValue: existing.notes || null,
          newValue: nextNotes
        });
        existing.notes = nextNotes;
      }
    }

    if (dto.categoryId !== undefined && dto.categoryId !== existing.categoryId) {
      let nextCat: PhonebookCategory | null = null;
      if (dto.categoryId) {
        nextCat = await this.categoryRepo.findOne({
          where: { id: dto.categoryId }
        });
        if (!nextCat) {
          throw new NotFoundException('Selected category not found');
        }
      }
      changes.push({
        field: 'category',
        label: 'Category',
        oldValue: existing.category?.name || null,
        newValue: nextCat?.name || null
      });
      existing.categoryId = dto.categoryId || null;
      existing.category = nextCat;
    }

    if (dto.isShared !== undefined && dto.isShared !== existing.isShared) {
      changes.push({
        field: 'isShared',
        label: 'Sharing Enabled',
        oldValue: existing.isShared ? 'Enabled' : 'Disabled',
        newValue: dto.isShared ? 'Enabled' : 'Disabled'
      });
      existing.isShared = dto.isShared;
    }

    if (dto.sharedWithUserIds !== undefined) {
      const nextUsers =
        dto.sharedWithUserIds.length > 0
          ? await this.userRepo.find({ where: { id: In(dto.sharedWithUserIds) } })
          : [];
      const oldIds = (existing.sharedWithUsers || []).map((u) => u.id).sort();
      const newIds = nextUsers.map((u) => u.id).sort();
      if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
        changes.push({
          field: 'sharedWithUsers',
          label: 'Shared With Users',
          oldValue: (existing.sharedWithUsers || []).map((u) => u.name).join(', ') || 'None',
          newValue: nextUsers.map((u) => u.name).join(', ') || 'None'
        });
        existing.sharedWithUsers = nextUsers;
      }
    }

    if (dto.sharedWithRoleIds !== undefined) {
      const nextRoles =
        dto.sharedWithRoleIds.length > 0
          ? await this.roleRepo.find({ where: { id: In(dto.sharedWithRoleIds) } })
          : [];
      const oldIds = (existing.sharedWithRoles || []).map((r) => r.id).sort();
      const newIds = nextRoles.map((r) => r.id).sort();
      if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
        changes.push({
          field: 'sharedWithRoles',
          label: 'Shared With Roles',
          oldValue:
            (existing.sharedWithRoles || [])
              .map((r) => r.displayName || r.name)
              .join(', ') || 'None',
          newValue:
            nextRoles.map((r) => r.displayName || r.name).join(', ') || 'None'
        });
        existing.sharedWithRoles = nextRoles;
      }
    }

    // Keep createdBy & createdAt intact; update updatedBy
    existing.updatedBy = user.id;
    await this.entryRepo.save(existing);

    if (changes.length > 0) {
      await this.historyRepo.save(
        this.historyRepo.create({
          entryId: existing.id,
          action: 'updated',
          editedById: user.id,
          createdBy: user.id,
          updatedBy: user.id,
          changes
        })
      );
    }

    const updated = await this.entryRepo.findOne({
      where: { id: existing.id },
      relations: [
        'category',
        'sharedWithUsers',
        'sharedWithRoles',
        'creator',
        'updater'
      ]
    });

    return this.serializeEntry(updated);
  }

  async deleteEntry(id: string, user: UserEntity) {
    if (!this.isSuperUser(user)) {
      throw new ForbiddenException(
        'Only Super User is allowed to delete phonebook numbers'
      );
    }

    const existing = await this.entryRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Phonebook entry not found');
    }

    await this.entryRepo.remove(existing);
    return { message: 'Phonebook entry deleted successfully' };
  }

  async getEntryHistory(id: string, user: UserEntity) {
    if (!this.isSuperUser(user)) {
      throw new ForbiddenException(
        'Only Super User can view change history of phonebook numbers'
      );
    }

    const existing = await this.entryRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Phonebook entry not found');
    }

    const histories = await this.historyRepo.find({
      where: { entryId: id },
      relations: ['editedBy'],
      order: { createdAt: 'DESC' }
    });

    return histories.map((h) => ({
      id: h.id,
      entryId: h.entryId,
      action: h.action,
      editedAt: h.createdAt,
      editedBy: this.sanitizeUser(h.editedBy),
      changes: h.changes || []
    }));
  }

  async getClientContacts(user: UserEntity) {
    if (!this.isManagerOrAbove(user)) {
      return {
        canViewClients: false,
        currentFiscalYear: null,
        items: []
      };
    }

    let currentWorkingYear = null;
    try {
      currentWorkingYear = await this.workingYearService.findCurrent();
    } catch {
      currentWorkingYear = null;
    }

    const isSuper = this.isSuperUser(user);

    if (isSuper) {
      const customers = await this.customerRepo.find({
        where: { status: Not('archive') },
        order: { name: 'ASC' }
      });

      const projectMap = new Map<string, string[]>();
      if (currentWorkingYear) {
        const fyProjects = await this.projectRepo
          .createQueryBuilder('project')
          .leftJoinAndSelect('project.customer', 'customer')
          .where('project.customer IS NOT NULL')
          .andWhere('project.status = :status', { status: 'active' })
          .andWhere(
            '(project.workingYearId = :wyId OR (project.workingYearId IS NULL AND project.fiscalYear = :fy))',
            {
              wyId: currentWorkingYear.id,
              fy: currentWorkingYear.nepaliStartYear
            }
          )
          .getMany();

        for (const proj of fyProjects) {
          if (proj.customer?.id) {
            const list = projectMap.get(proj.customer.id) || [];
            list.push(proj.name);
            projectMap.set(proj.customer.id, list);
          }
        }
      }

      return {
        canViewClients: true,
        currentFiscalYear: currentWorkingYear
          ? { id: currentWorkingYear.id, name: currentWorkingYear.name }
          : null,
        items: customers.map((c) => ({
          id: c.id,
          name: c.name,
          shortName: c.shortName || null,
          status: c.status,
          contactPerson: c.contactPerson || null,
          contactPersonDesignation: c.contactPersonDesignation || null,
          contactPersonPhone: c.contactPersonPhone || null,
          activeProjects: projectMap.get(c.id) || []
        }))
      };
    }

    // For Manager and above (non-superuser):
    // Only clients where user is actively involved in an active client project of this fiscal year
    if (!currentWorkingYear) {
      return {
        canViewClients: true,
        currentFiscalYear: null,
        items: []
      };
    }

    const fyProjects = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.customer', 'customer')
      .leftJoinAndSelect('project.projectManager', 'projectManager')
      .leftJoinAndSelect('project.projectLead', 'projectLead')
      .leftJoinAndSelect('project.users', 'users')
      .where('project.customer IS NOT NULL')
      .andWhere('project.status = :status', { status: 'active' })
      .andWhere(
        '(project.workingYearId = :wyId OR (project.workingYearId IS NULL AND project.fiscalYear = :fy))',
        {
          wyId: currentWorkingYear.id,
          fy: currentWorkingYear.nepaliStartYear
        }
      )
      .getMany();

    const activeAssignments = await this.assignmentRepo.find({
      where: { userId: user.id, isActive: true }
    });
    const assignedProjectIds = new Set(
      activeAssignments.map((a) => a.projectId)
    );

    const clientMap = new Map<
      string,
      {
        customer: Customer;
        activeProjects: string[];
      }
    >();

    for (const proj of fyProjects) {
      if (!proj.customer || proj.customer.status === 'archive') continue;

      const isInvolved =
        proj.projectManager?.id === user.id ||
        proj.projectLead?.id === user.id ||
        (proj.users || []).some((u) => u.id === user.id) ||
        assignedProjectIds.has(proj.id);

      if (!isInvolved) continue;

      const existing = clientMap.get(proj.customer.id);
      if (existing) {
        existing.activeProjects.push(proj.name);
      } else {
        clientMap.set(proj.customer.id, {
          customer: proj.customer,
          activeProjects: [proj.name]
        });
      }
    }

    const items = Array.from(clientMap.values())
      .sort((a, b) => a.customer.name.localeCompare(b.customer.name))
      .map(({ customer, activeProjects }) => ({
        id: customer.id,
        name: customer.name,
        shortName: customer.shortName || null,
        status: customer.status,
        contactPerson: customer.contactPerson || null,
        contactPersonDesignation: customer.contactPersonDesignation || null,
        contactPersonPhone: customer.contactPersonPhone || null,
        activeProjects
      }));

    return {
      canViewClients: true,
      currentFiscalYear: {
        id: currentWorkingYear.id,
        name: currentWorkingYear.name
      },
      items
    };
  }
}
