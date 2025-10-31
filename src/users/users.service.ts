import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUsersDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserProfileEntity } from './entities/user.profile.entity';
import { UserBankDetailEntity } from './entities/user.bankdetail.entity';
import { UserContractEntity } from './entities/user.contractdocument.entity';
import { UserTrainningEntity } from './entities/user.trainingcertificate.entity';
import { UserDocumentEntity } from './entities/user.document.entity';
import { UserEducationDetailEntity } from './entities/user.educationdetail.entity';
import { UserHistoryService } from './services/user-history.service';
import { HistoryActionType } from './entities/user.history.entity';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserProfileEntity)
    private profileRepository: Repository<UserProfileEntity>,
    @InjectRepository(UserEducationDetailEntity)
    private educationRepository: Repository<UserEducationDetailEntity>,
    @InjectRepository(UserBankDetailEntity)
    private bankRepository: Repository<UserBankDetailEntity>,
    @InjectRepository(UserContractEntity)
    private contractRepository: Repository<UserContractEntity>,
    @InjectRepository(UserDocumentEntity)
    private documentRepository: Repository<UserDocumentEntity>,
    @InjectRepository(UserTrainningEntity)
    private trainingRepository: Repository<UserTrainningEntity>,

    private readonly authService: AuthService,
    private readonly userHistoryService: UserHistoryService
  ) {}

  async create(createUsersDto: CreateUsersDto) {
    const { email, name, role, hourlyRate } = createUsersDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException('User already exists');
    }
    const savedUser = await this.authService.create({
      email,
      name,
      username: name,
      roleId: role,
      hourlyRate: typeof hourlyRate === 'number' ? hourlyRate : 500
    });

    return savedUser;
  }

  async createDetail(id, option, createUsersDto: any, file, destinationFolder?: string, modifierUser?: UserEntity) {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    let savedData;

    // Generate the file path relative to public folder
    let filePath = null;
    if (file) {
      // Store path relative to public folder, e.g., /document/bank/uuid.jpg
      const publicPath = destinationFolder ? destinationFolder.replace('public', '') : '/document';
      filePath = `${publicPath}/${file.filename}`;
    }

    // Conditionally include documentFile only for entities that support it
    const entitiesWithDocumentFile = ['bank', 'contract', 'document', 'training', 'education'];
    
    const dataToUpdate = {
      ...createUsersDto,
      user: user // Use the user entity relationship instead of userId
    };
    
    // Only add documentFile if this entity type supports it
    if (filePath && entitiesWithDocumentFile.includes(option)) {
      dataToUpdate['documentFile'] = filePath;
    }
    
    const repository = {
      bank: this.bankRepository,
      profile: this.profileRepository,
      contract: this.contractRepository,
      document: this.documentRepository,
      training: this.trainingRepository,
      education: this.educationRepository
    };

    const repo = repository[option];
    if (!repo) {
      throw new BadRequestException(
        `Repository for ${option} not found`
      );
    }

    // Check if a record already exists for this user
    const existingRecord = await repo.findOne({ where: { user: { id } } });
    
    // Determine action type based on option
    const actionTypeMap = {
      bank: HistoryActionType.OTHER,
      profile: HistoryActionType.PROFILE_UPDATE,
      contract: HistoryActionType.CONTRACT_UPDATE,
      document: HistoryActionType.OTHER,
      training: HistoryActionType.OTHER,
      education: HistoryActionType.OTHER
    };
    
    const actionType = actionTypeMap[option] || HistoryActionType.OTHER;
    
    if (existingRecord) {
      // Track changes for history if modifier user is provided
      if (modifierUser) {
        // Find significant changes to log
        const significantChanges = Object.keys(createUsersDto).filter(key => {
          // Skip non-significant fields
          if (['id', 'user', 'documentFile'].includes(key)) return false;
          
          return existingRecord[key] !== createUsersDto[key];
        });
        
        // Log each significant change
        for (const field of significantChanges) {
          await this.userHistoryService.createHistoryRecord(
            user,
            modifierUser,
            actionType,
            field,
            existingRecord[field],
            createUsersDto[field],
            `Updated ${option} detail: ${field}`
          );
        }
        
        // Special handling for department changes
        if (option === 'profile' && createUsersDto.departmentId !== existingRecord.departmentId) {
          await this.userHistoryService.createHistoryRecord(
            user,
            modifierUser,
            HistoryActionType.DEPARTMENT_CHANGE,
            'departmentId',
            existingRecord.departmentId,
            createUsersDto.departmentId,
            `User department changed`
          );
        }
      }
      
      // Update existing record
      const updateData = { ...createUsersDto };
      // Only add documentFile if this entity type supports it
      if (filePath && entitiesWithDocumentFile.includes(option)) {
        updateData['documentFile'] = filePath;
      }
      await repo.update(existingRecord.id, updateData);
      savedData = await repo.findOne({ where: { id: existingRecord.id } });
    } else {
      // Create new record
      const newRecord = repo.create(dataToUpdate);
      savedData = await repo.save(newRecord);
      
      // Log creation of new record
      if (modifierUser) {
        await this.userHistoryService.createHistoryRecord(
          user,
          modifierUser,
          actionType,
          option,
          null,
          'Record created',
          `Created new ${option} record`
        );
        
        // Special case for department creation
        if (option === 'profile' && createUsersDto.departmentId) {
          await this.userHistoryService.createHistoryRecord(
            user,
            modifierUser,
            HistoryActionType.DEPARTMENT_CHANGE,
            'departmentId',
            null,
            createUsersDto.departmentId,
            `User department set`
          );
        }
      }
    }
    
    return savedData;
  }

  async findAll() {
    // This method should be implemented based on your requirements
    // For now, return a basic message or implement pagination
    return this.userRepository.find({
      relations: ['role'],
      select: ['id', 'name', 'email', 'username', 'status', 'createdAt', 'updatedAt']
    });
  }

  async findByRoles(roleNames: string[]) {
    // Normalize role names for case-insensitive matching
    const normalizedRoles = roleNames.map(name => name.toLowerCase());
    
    // Build a query to match exact roles or roles containing the name
    // This handles both exact matches and cases like "projectmanager" when searching for "manager"
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');
    
    // Build the WHERE conditions to match roles
    const whereConditions = [];
    const params = {};
    
    normalizedRoles.forEach((roleName, index) => {
      // Add condition for exact match
      whereConditions.push(`LOWER(role.name) = :exactRole${index}`);
      params[`exactRole${index}`] = roleName;
      
      // Add condition for partial match (e.g., 'projectmanager' contains 'manager')
      whereConditions.push(`LOWER(role.name) LIKE :partialRole${index}`);
      params[`partialRole${index}`] = `%${roleName}%`;
    });
    
    queryBuilder.where(`(${whereConditions.join(' OR ')})`).setParameters(params);    
    return queryBuilder.getMany();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'role',
        'bank_detail',
        'profile',
        'education_detail',
        'trainning_detail',
        'contract_detail',
        'document'
      ]
    });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, modifierUser?: UserEntity) {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Convert role field to roleId if provided (matching create behavior)
    const updateData: any = { ...updateUserDto };
    
    // Always convert role to roleId if role field exists to prevent TypeORM errors
    if (updateUserDto.role) {
      // Track role changes in history only if the role actually changed
      if (user.roleId !== updateUserDto.role) {
        // TypeScript-safe approach to get role name
        const oldRole: any = await this.userRepository.manager.findOne('role', user.roleId);
        const newRole: any = await this.userRepository.manager.findOne('role', updateUserDto.role);
        
        const oldRoleName = oldRole && oldRole.name ? oldRole.name : 'unknown';
        const newRoleName = newRole && newRole.name ? newRole.name : 'unknown';
              
        // Always record role changes, even without a modifier user (use system as default)
        const modifier = modifierUser || await this.findSystemUser();
        await this.userHistoryService.createHistoryRecord(
          user,
          modifier,
          HistoryActionType.ROLE_CHANGE,
          'role',
          oldRoleName,
          newRoleName,
          `User role changed from ${oldRoleName} to ${newRoleName} by ${modifier.name}`
        );
      }
      
      // Always convert role to roleId and remove role field to avoid TypeORM constraint errors
      updateData.roleId = updateUserDto.role;
      delete updateData.role;
    }
    
    // Track hourly rate changes
    if (typeof updateUserDto.hourlyRate === 'number' && user.hourlyRate !== updateUserDto.hourlyRate) {
      const modifier = modifierUser || await this.findSystemUser();
      await this.userHistoryService.createHistoryRecord(
        user,
        modifier,
        HistoryActionType.OTHER,
        'hourlyRate',
        user.hourlyRate,
        updateUserDto.hourlyRate,
        `Hourly rate updated from ${user.hourlyRate} to ${updateUserDto.hourlyRate}`
      );
      
      updateData.hourlyRate = updateUserDto.hourlyRate;
    }
    
    // Track name changes
    if (updateUserDto.name && user.name !== updateUserDto.name) {
      const modifier = modifierUser || await this.findSystemUser();
      await this.userHistoryService.createHistoryRecord(
        user,
        modifier,
        HistoryActionType.PROFILE_UPDATE,
        'name',
        user.name,
        updateUserDto.name,
        `User name changed from ${user.name} to ${updateUserDto.name}`
      );
    }
    
    // Track email changes
    if (updateUserDto.email && user.email !== updateUserDto.email) {
      const modifier = modifierUser || await this.findSystemUser();
      await this.userHistoryService.createHistoryRecord(
        user,
        modifier,
        HistoryActionType.PROFILE_UPDATE,
        'email',
        user.email,
        updateUserDto.email,
        `User email changed from ${user.email} to ${updateUserDto.email}`
      );
    }
    
    // Use the auth service's update method which has proper validation and role handling
    // Pass along the modifier user for history tracking
    return await this.authService.update(id, updateData, modifierUser);
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
  
  /**
   * Updates the user's last active timestamp
   * @param userId The ID of the user
   * @param timestamp The timestamp of the last activity
   */
  async updateLastActive(userId: string, timestamp: Date) {
    try {
      // Validate userId first to avoid unnecessary DB lookups
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.warn('Invalid userId provided for activity tracking');
        return { affected: 0, success: false, message: 'Invalid user ID' };
      }
      // Try a more robust approach for TypeORM 0.2.x
      let user;
      try {
        // First try the object syntax
        user = await this.userRepository.findOne({ where: { id: userId } });
      } catch (findError) {
        try {
          // Fall back to direct ID approach if the object syntax fails
          user = await this.userRepository.findOne(userId);
        } catch (secondError) {
          console.error('Both findOne attempts failed:', secondError.message);
          // Return success false but don't throw to prevent UI disruption
          return { affected: 0, success: false, message: 'Failed to locate user record' };
        }
      }
      
      if (!user) {
        console.warn(`User not found with ID: ${userId}`);
        // Create a silent failure for activity tracking to avoid disrupting the user experience
        return { affected: 0, success: false, message: 'User not found' };
      }
      
      
      try {
        // Update only the lastActiveAt field
        const updateResult = await this.userRepository.update(userId, {
          lastActiveAt: timestamp
        });
        
        return { ...updateResult, success: true };
      } catch (updateError) {
        console.error('Failed to update lastActiveAt:', updateError.message);
        // Return success false but don't throw to prevent UI disruption
        return { affected: 0, success: false, message: 'Failed to update activity time' };
      }
    } catch (error) {

      return { affected: 0, success: false, message: error.message || 'Unknown error' };
    }
  }
  
  async findUserDocument(userId: string, documentId: string) {
    return this.documentRepository.findOne({
      where: {
        id: documentId,
        user: { id: userId }
      }
    });
  }
  
  async findUserBankDetail(userId: string, bankDetailId: string) {
    return this.bankRepository.findOne({
      where: {
        id: bankDetailId,
        user: { id: userId }
      }
    });
  }
  
  async findUserEducationDetail(userId: string, educationDetailId: string) {
    return this.educationRepository.findOne({
      where: {
        id: educationDetailId,
        user: { id: userId }
      }
    });
  }
  
  async findUserTrainingCertificate(userId: string, trainingId: string) {
    return this.trainingRepository.findOne({
      where: {
        id: trainingId,
        user: { id: userId }
      }
    });
  }
  
  async deleteUserDocument(documentId: string, modifierUser?: UserEntity) {
    const document = await this.documentRepository.findOne(documentId, { relations: ['user'] });
    
    if (!document) {
      throw new BadRequestException('Document not found');
    }
    
    // Track history if modifier user is provided
    if (modifierUser) {
      await this.userHistoryService.createHistoryRecord(
        document.user,
        modifierUser,
        HistoryActionType.OTHER,
        'document',
        JSON.stringify({ id: document.id, type: document.documentType }),
        null,
        `Document ${document.documentType || 'file'} deleted`
      );
    }
    
    return this.documentRepository.remove(document);
  }
  
  async verifyUserDetails(id: string, detailType: string | null, verifier: UserEntity) {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    // Determine which repositories to update based on detailType
    const repositories = detailType 
      ? this.getRepositoryByType(detailType)
      : {
          profile: this.profileRepository,
          bank: this.bankRepository,
          contract: this.contractRepository,
          document: this.documentRepository,
          training: this.trainingRepository,
          education: this.educationRepository
        };
    
    const results = {};
    
    // Update each repository
    for (const [type, repo] of Object.entries(repositories)) {
      const records = await repo.find({ where: { user: { id } } });
      
      if (records && records.length > 0) {
        for (const record of records) {
          // Skip already verified records
          if (record.isVerified) continue;
          
          // Update verification fields
          await repo.update(record.id, {
            isVerified: true,
            verifiedById: verifier.id,
            verifiedAt: new Date()
          });
          
          // Log the verification action
          await this.userHistoryService.createHistoryRecord(
            user,
            verifier,
            HistoryActionType.VERIFICATION,
            type,
            'Unverified',
            'Verified',
            `${type} details verified by ${verifier.name}`
          );
        }
        
        results[type] = `${type} details verified`;
      } else {
        results[type] = `No ${type} details found`;
      }
    }
    
    return {
      message: 'Verification completed',
      details: results
    };
  }
  
  private getRepositoryByType(detailType: string) {
    const repositories = {
      profile: this.profileRepository,
      bank: this.bankRepository,
      contract: this.contractRepository,
      document: this.documentRepository,
      training: this.trainingRepository,
      education: this.educationRepository
    };
    
    if (!repositories[detailType]) {
      throw new BadRequestException(`Invalid detail type: ${detailType}`);
    }
    
    return { [detailType]: repositories[detailType] };
  }
  
  /**
   * Get or create a system user for history tracking when no modifier is available
   * This ensures history records always have a modifier, even for system-level changes
   */
  private async findSystemUser(): Promise<UserEntity> {
    // First try to find the system user
    const systemUser = await this.userRepository.findOne({ 
      where: { email: 'system@artha.local' } 
    });
    
    if (systemUser) {
      return systemUser;
    }
    
    // If system user doesn't exist, use the first admin user
    const adminUser = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.role', 'role')
      .where('role.name = :roleName', { roleName: 'Admin' })
      .getOne();
      
    if (adminUser) {
      return adminUser;
    }
    
    // As a last resort, use the first user in the system
    const firstUser = await this.userRepository.findOne({});
    if (firstUser) {
      return firstUser;
    }
    
    // This should never happen in a production system
    throw new Error('No users found in the system for history tracking');
  }
}
