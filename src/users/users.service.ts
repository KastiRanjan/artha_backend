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

    private readonly authService: AuthService
  ) { }

  async create(createUsersDto: CreateUsersDto) {
    const { email, name, role } = createUsersDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException('User already exists');
    }
    const savedUser = await this.authService.create({
      email,
      name,
      username: name,
      roleId: role
    });

    return savedUser;
  }

  async createDetail(id, option, createUsersDto: any, file) {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    let savedData;

    const dataToUpdate = {
      ...createUsersDto,
      userId: id,
      documentFile: file?.filename
    }
    let repository = {
      bank: this.bankRepository,
      profile: this.profileRepository,
      contract: this.contractRepository,
      document: this.documentRepository,
      training: this.trainingRepository,
      education: this.educationRepository
    }

    const repo = repository[option];
    if (!repo) {
      throw new BadRequestException(`Repository for ${repository[option]} not found`);
    }

    savedData = await repo.preload(dataToUpdate);
    if (!savedData.id) {
      savedData = await repo.save(savedData);
    } else {
      await repo.update(savedData.id, savedData);
    }
    return savedData;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
