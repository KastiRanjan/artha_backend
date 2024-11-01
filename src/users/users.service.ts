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
  ) {}

  async create(createUsersDto: CreateUsersDto) {
    const { email, name, role } = createUsersDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new Error('User already exists');
    }
    const savedUser = await this.authService.create({
      email,
      name,
      username: name,
      roleId: role
    });

    const personal = await this.profileRepository.create({
      ...createUsersDto.personal,
      user: savedUser
    });
    await this.profileRepository.save(personal);

    const education = await this.educationRepository.create({
      ...createUsersDto.education,
      user: savedUser
    });
    await this.educationRepository.save(education);

    const bank = await this.bankRepository.create({
      ...createUsersDto.bank,
      user: savedUser
    });
    await this.bankRepository.save(bank);

    const contract = await this.contractRepository.create({
      ...createUsersDto.contract,
      user: savedUser
    });
    await this.contractRepository.save(contract);

    const training = await this.trainingRepository.create({
      ...createUsersDto.training,
      user: savedUser
    });
    await this.trainingRepository.save(training);

    const document = await this.documentRepository.create({
      ...createUsersDto.document,
      user: savedUser
    });
    await this.documentRepository.save(document);
    return savedUser;
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

     // Update user profile
     if (updateUserDto.personal) {
      const profile = await this.profileRepository.findOne({ where: { user: user.id } });
      Object.assign(profile, updateUserDto.personal);
      await this.profileRepository.save(profile);
    }

    // Update bank details
    if (updateUserDto.bank) {
      const bankDetails = await this.bankRepository.findOne({ where: { user: user.id } });
      Object.assign(bankDetails, updateUserDto.bank);
      await this.bankRepository.save(bankDetails);
    }

    // if (files) {
    //   if (files.bankdetail) {
    //     const profilePicturePath = await this.fileUploadService.uploadFile(files.profilePicture);
    //     const profile = await this.profileRepository.findOne({ where: { user: user.id } });
    //     profile.profilePicture = profilePicturePath;
    //     await this.profileRepository.save(profile);
    //   }

    // }
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
