import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatureOfWork } from './entities/nature-of-work.entity';
import { NatureOfWorkGroup } from './entities/nature-of-work-group.entity';
import { Project } from 'src/projects/entities/project.entity';
import { CreateNatureOfWorkDto } from './dto/create-nature-of-work.dto';
import { UpdateNatureOfWorkDto } from './dto/update-nature-of-work.dto';
import { CreateNatureOfWorkGroupDto } from './dto/create-nature-of-work-group.dto';
import { UpdateNatureOfWorkGroupDto } from './dto/update-nature-of-work-group.dto';
import { MigrateNatureOfWorkDto, MigrationStrategy } from './dto/migrate-nature-of-work.dto';

@Injectable()
export class NatureOfWorkService {
  constructor(
    @InjectRepository(NatureOfWork)
    private readonly natureOfWorkRepository: Repository<NatureOfWork>,
    @InjectRepository(NatureOfWorkGroup)
    private readonly groupRepository: Repository<NatureOfWorkGroup>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  // ==========================================
  // Nature of Work CRUD
  // ==========================================

  async create(dto: CreateNatureOfWorkDto) {
    const entityData: any = {
      name: dto.name,
      shortName: dto.shortName,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    };

    if (dto.groupId) {
      const group = await this.groupRepository.findOne({ where: { id: dto.groupId } });
      if (!group) {
        throw new NotFoundException(`NatureOfWorkGroup with ID ${dto.groupId} not found`);
      }
      entityData.group = group;
      entityData.groupId = dto.groupId;
    }

    const entity = this.natureOfWorkRepository.create(entityData);
    return this.natureOfWorkRepository.save(entity);
  }

  /**
   * Find all nature of works. By default only returns active ones.
   * Pass includeInactive=true to get all.
   */
  async findAll(includeInactive = false) {
    const findOptions: any = {
      relations: ['group'],
      order: { name: 'ASC' },
    };
    if (!includeInactive) {
      findOptions.where = { isActive: true };
    }
    return this.natureOfWorkRepository.find(findOptions);
  }

  findOne(id: string) {
    return this.natureOfWorkRepository.findOne({
      where: { id },
      relations: ['group'],
    });
  }

  async update(id: string, dto: UpdateNatureOfWorkDto) {
    const entity = await this.natureOfWorkRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`NatureOfWork with ID ${id} not found`);
    }

    if (dto.groupId !== undefined) {
      if (!dto.groupId) {
        entity.group = undefined;
        entity.groupId = undefined;
      } else {
        const group = await this.groupRepository.findOne({ where: { id: dto.groupId } });
        if (!group) {
          throw new NotFoundException(`NatureOfWorkGroup with ID ${dto.groupId} not found`);
        }
        entity.group = group;
        entity.groupId = dto.groupId;
      }
    }

    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.shortName !== undefined) entity.shortName = dto.shortName;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;

    return this.natureOfWorkRepository.save(entity);
  }

  async remove(id: string) {
    // Check for affected projects before deleting
    const affectedProjects = await this.getAffectedProjects(id);
    if (affectedProjects.length > 0) {
      throw new BadRequestException(
        `Cannot delete NatureOfWork: ${affectedProjects.length} project(s) are using it. Please migrate them first.`
      );
    }
    return this.natureOfWorkRepository.delete(id);
  }

  // ==========================================
  // Group CRUD
  // ==========================================

  async createGroup(dto: CreateNatureOfWorkGroupDto) {
    const entity = this.groupRepository.create(dto);
    return this.groupRepository.save(entity);
  }

  async findAllGroups() {
    const groups = await this.groupRepository.find({
      relations: ['natureOfWorks'],
      order: { rank: 'ASC', name: 'ASC' },
    });

    // Keep fallback/inactive natures out of default group listings.
    return groups.map((group) => ({
      ...group,
      natureOfWorks: (group.natureOfWorks || []).filter((now) => now.isActive),
    }));
  }

  async findOneGroup(id: string) {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['natureOfWorks'],
    });
    if (!group) {
      throw new NotFoundException(`NatureOfWorkGroup with ID ${id} not found`);
    }

    group.natureOfWorks = (group.natureOfWorks || []).filter((now) => now.isActive);
    return group;
  }

  async updateGroup(id: string, dto: UpdateNatureOfWorkGroupDto) {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`NatureOfWorkGroup with ID ${id} not found`);
    }
    Object.assign(group, dto);
    return this.groupRepository.save(group);
  }

  async removeGroup(id: string) {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['natureOfWorks'],
    });
    if (!group) {
      throw new NotFoundException(`NatureOfWorkGroup with ID ${id} not found`);
    }
    if (group.natureOfWorks && group.natureOfWorks.length > 0) {
      throw new BadRequestException(
        `Cannot delete group: ${group.natureOfWorks.length} nature of work item(s) belong to it.`
      );
    }
    return this.groupRepository.delete(id);
  }

  // ==========================================
  // Affected Projects
  // ==========================================

  /**
   * Get all ACTIVE projects using a specific nature of work.
   * Old/archived/completed projects continue to use whatever they had.
   */
  async getAffectedProjects(natureOfWorkId: string) {
    return this.projectRepository.find({
      where: {
        natureOfWork: { id: natureOfWorkId },
      },
      relations: ['natureOfWork', 'natureOfWorkGroup', 'projectLead', 'customer'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Get only active projects affected by a nature of work change.
   */
  async getActiveAffectedProjects(natureOfWorkId: string) {
    return this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.natureOfWork', 'natureOfWork')
      .leftJoinAndSelect('project.natureOfWorkGroup', 'natureOfWorkGroup')
      .leftJoinAndSelect('project.projectLead', 'projectLead')
      .leftJoinAndSelect('project.customer', 'customer')
      .where('natureOfWork.id = :natureOfWorkId', { natureOfWorkId })
      .andWhere('project.status IN (:...statuses)', { statuses: ['active', 'suspended'] })
      .orderBy('project.name', 'ASC')
      .getMany();
  }

  // ==========================================
  // Migration Logic
  // ==========================================

  /**
   * Migrate nature of work with 3 strategies:
   *
   * 1. TRANSFER: Move all affected projects to an existing target nature of work.
   *
   * 2. FALLBACK: Mark the old nature of work as inactive (append "(fallback)" to name),
   *    update it in-place with new name/shortName/group. Old projects automatically
   *    keep the inactive version. Only active ones get the updated version.
   *
   * 3. DUPLICATE: Create a new nature of work, migrate selected projects to it,
   *    rename the old one with "(fallback)" suffix and mark as inactive.
   *    Old projects stay on the old (now inactive) version.
   */
  async migrate(dto: MigrateNatureOfWorkDto) {
    const source = await this.natureOfWorkRepository.findOne({
      where: { id: dto.sourceNatureOfWorkId },
      relations: ['group'],
    });

    if (!source) {
      throw new NotFoundException(`NatureOfWork with ID ${dto.sourceNatureOfWorkId} not found`);
    }

    switch (dto.strategy) {
      case MigrationStrategy.TRANSFER:
        return this.migrateTransfer(source, dto);

      case MigrationStrategy.FALLBACK:
        return this.migrateFallback(source, dto);

      case MigrationStrategy.DUPLICATE:
        return this.migrateDuplicate(source, dto);

      default:
        throw new BadRequestException(`Unknown migration strategy: ${dto.strategy}`);
    }
  }

  /**
   * TRANSFER: Move all projects from source to an existing target nature of work.
   */
  private async migrateTransfer(source: NatureOfWork, dto: MigrateNatureOfWorkDto) {
    if (!dto.targetNatureOfWorkId) {
      throw new BadRequestException('targetNatureOfWorkId is required for TRANSFER strategy');
    }

    const target = await this.natureOfWorkRepository.findOne({
      where: { id: dto.targetNatureOfWorkId },
      relations: ['group'],
    });

    if (!target) {
      throw new NotFoundException(`Target NatureOfWork with ID ${dto.targetNatureOfWorkId} not found`);
    }

    // Get all affected projects
    const affectedProjects = await this.getAffectedProjects(source.id);

    // Move all projects to target
    for (const project of affectedProjects) {
      project.natureOfWork = target;
      if (target.group) {
        project.natureOfWorkGroup = target.group;
        project.natureOfWorkGroupId = target.groupId as any;
      } else {
        project.natureOfWorkGroup = undefined as any;
        project.natureOfWorkGroupId = undefined as any;
      }
      await this.projectRepository.save(project);
    }

    // Mark source as inactive
    source.isActive = false;
    await this.natureOfWorkRepository.save(source);

    return {
      message: `Transferred ${affectedProjects.length} project(s) from "${source.name}" to "${target.name}"`,
      migratedCount: affectedProjects.length,
      source: source,
      target: target,
    };
  }

  /**
   * FALLBACK: Create a fallback copy of old, update in-place.
   * - Clone old nature of work as "(fallback)" + inactive
   * - Reassign non-active projects to the fallback clone
   * - Update the original with new name/shortName/group
   * - Active projects keep the original (now updated) version
   */
  private async migrateFallback(source: NatureOfWork, dto: MigrateNatureOfWorkDto) {
    if (!dto.newName) {
      throw new BadRequestException('newName is required for FALLBACK strategy');
    }

    // 1. Create fallback copy of the old nature of work
    const fallbackName = `${source.name} (fallback)`;
    const fallback = this.natureOfWorkRepository.create({
      name: fallbackName,
      shortName: source.shortName,
      isActive: false,
      group: source.group,
      groupId: source.groupId,
    });
    const savedFallback = await this.natureOfWorkRepository.save(fallback);

    // 2. Move non-active (archived/completed/signed_off) projects to the fallback
    const allProjects = await this.getAffectedProjects(source.id);
    const nonActiveProjects = allProjects.filter(
      p => !['active', 'suspended'].includes(p.status)
    );
    for (const project of nonActiveProjects) {
      project.natureOfWork = savedFallback;
      await this.projectRepository.save(project);
    }

    // 3. Update the source with new values (active projects keep this)
    source.name = dto.newName;
    if (dto.newShortName) source.shortName = dto.newShortName;
    source.isActive = true;

    if (dto.newGroupId) {
      const group = await this.groupRepository.findOne({ where: { id: dto.newGroupId } });
      if (!group) {
        throw new NotFoundException(`NatureOfWorkGroup with ID ${dto.newGroupId} not found`);
      }
      source.group = group;
      source.groupId = dto.newGroupId;
    }

    await this.natureOfWorkRepository.save(source);

    // 4. Update group on active projects
    const activeProjects = allProjects.filter(
      p => ['active', 'suspended'].includes(p.status)
    );
    for (const project of activeProjects) {
      project.natureOfWorkGroupId = source.groupId || (undefined as any);
      project.natureOfWorkGroup = source.group || (undefined as any);
      await this.projectRepository.save(project);
    }

    return {
      message: `Fallback created. ${nonActiveProjects.length} old project(s) moved to fallback "${fallbackName}". ${activeProjects.length} active project(s) updated.`,
      migratedCount: nonActiveProjects.length,
      activeCount: activeProjects.length,
      source: source,
      fallback: savedFallback,
    };
  }

  /**
   * DUPLICATE: Create new nature of work, migrate selected projects, rename old as fallback.
   * - Create new nature of work with new name/shortName/group
   * - Migrate selected projects to the new one
   * - Rename old one with "(fallback)" suffix and mark inactive
   * - Projects not selected stay on old (inactive) version
   */
  private async migrateDuplicate(source: NatureOfWork, dto: MigrateNatureOfWorkDto) {
    if (!dto.newName) {
      throw new BadRequestException('newName is required for DUPLICATE strategy');
    }

    // 1. Create new nature of work
    const newEntityData: any = {
      name: dto.newName,
      shortName: dto.newShortName || source.shortName,
      isActive: true,
    };

    if (dto.newGroupId) {
      const group = await this.groupRepository.findOne({ where: { id: dto.newGroupId } });
      if (!group) {
        throw new NotFoundException(`NatureOfWorkGroup with ID ${dto.newGroupId} not found`);
      }
      newEntityData.group = group;
      newEntityData.groupId = dto.newGroupId;
    }

    const newEntity = this.natureOfWorkRepository.create(newEntityData as Partial<NatureOfWork>);
    const savedNew = await this.natureOfWorkRepository.save(newEntity as NatureOfWork);

    // 2. Migrate selected projects to new nature of work
    let migratedCount = 0;
    if (dto.projectIdsToMigrate && dto.projectIdsToMigrate.length > 0) {
      for (const projectId of dto.projectIdsToMigrate) {
        const project = await this.projectRepository.findOne({
          where: { id: projectId },
          relations: ['natureOfWork'],
        });
        if (project && project.natureOfWork?.id === source.id) {
          project.natureOfWork = savedNew;
          if (savedNew.groupId) {
            project.natureOfWorkGroupId = savedNew.groupId;
            project.natureOfWorkGroup = savedNew.group as any;
          } else {
            project.natureOfWorkGroupId = undefined as any;
            project.natureOfWorkGroup = undefined as any;
          }
          await this.projectRepository.save(project);
          migratedCount++;
        }
      }
    }

    // 3. Rename old and mark inactive
    source.name = `${source.name} (fallback)`;
    source.isActive = false;
    await this.natureOfWorkRepository.save(source);

    return {
      message: `Duplicated. ${migratedCount} project(s) migrated to new "${dto.newName}". Old renamed to "${source.name}" and deactivated.`,
      migratedCount,
      newNatureOfWork: savedNew,
      oldNatureOfWork: source,
    };
  }
}
