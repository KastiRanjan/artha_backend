import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
  Request,
  Logger,
  ParseUUIDPipe,
  UseGuards
} from '@nestjs/common';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync, renameSync } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { UsersService } from './users.service';
import { CreateUsersDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { multerOptionsHelper } from 'src/common/helper/multer-options.helper';
import { UserHistoryService } from './services/user-history.service';
import { HistoryActionType } from './entities/user.history.entity';
import { UserDocumentEntity } from './entities/user.document.entity';
import { UserBankDetailEntity } from './entities/user.bankdetail.entity';
import { UserEducationDetailEntity } from './entities/user.educationdetail.entity';
import { UserTrainningEntity } from './entities/user.trainingcertificate.entity';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userHistoryService: UserHistoryService,
    @InjectRepository(UserDocumentEntity)
    private readonly documentRepository: Repository<UserDocumentEntity>,
    @InjectRepository(UserBankDetailEntity)
    private readonly bankDetailRepository: Repository<UserBankDetailEntity>,
    @InjectRepository(UserEducationDetailEntity)
    private readonly educationDetailRepository: Repository<UserEducationDetailEntity>,
    @InjectRepository(UserTrainningEntity)
    private readonly trainingRepository: Repository<UserTrainningEntity>
  ) {}

  @Post()
  create(@Body() createUsersDto: CreateUsersDto) {
    return this.usersService.create(createUsersDto);
  }
  @Post(':id')
  async createDetail(
    @Param('id') id: string,
    @Query('option') option: string,
    @Body() createUsersDto: any,
    @Request() req
  ) {
    const folderMap = {
      bank: 'public/document/bank',
      education: 'public/document/education',
      training: 'public/document/training',
      contract: 'public/document/contract',
      document: 'public/document/user',
      profile: 'public/document/profile'
    };
    
    const destinationFolder = folderMap[option] || 'public/document';
    
    // If we have authenticated user info, pass it to track history
    const modifierUser = req.user ? await this.usersService.findOne(req.user.id) : null;
    
    return this.usersService.createDetail(
      id, 
      option, 
      createUsersDto, 
      null, 
      destinationFolder,
      modifierUser
    );
  }
  
  @Post(':id/upload')
  @UseInterceptors(
    FileInterceptor(
      'documentFile',
      multerOptionsHelper('public/document', 10000000, ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'])
    )
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Query('option') option: string,
    @Body() createUsersDto: any,
    @Request() req
  ) {
    const folderMap = {
      bank: 'public/document/bank',
      education: 'public/document/education',
      training: 'public/document/training',
      contract: 'public/document/contract',
      document: 'public/document/user',
      profile: 'public/document/profile'
    };
    
    const destinationFolder = folderMap[option] || 'public/document';
    
    // Move the file to the correct folder
    if (file) {
      const path = require('path');
      
      // Create destination folder if it doesn't exist
      if (!existsSync(destinationFolder)) {
        mkdirSync(destinationFolder, { recursive: true });
      }
      
      const newFilePath = path.join(destinationFolder, file.filename);
      
      // Move file from temp location to the correct folder
      if (file.path !== newFilePath) {
        renameSync(file.path, newFilePath);
        file.path = newFilePath;
      }
    }
    
    // If we have authenticated user info, pass it to track history
    const modifierUser = req.user ? await this.usersService.findOne(req.user.id) : null;
    
    return this.usersService.createDetail(
      id, 
      option, 
      createUsersDto, 
      file, 
      destinationFolder,
      modifierUser
    );
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('list-active')
  @UseGuards(JwtTwoFactorGuard)
  listActiveUsers() {
    return this.usersService.listActiveUsers();
  }

  @Get('role/:roleName')
  async findByRole(@Param('roleName') roleName: string) {
        // Special case for managers - include both manager and projectmanager roles
    let rolesToSearch = [roleName];
    if (roleName.toLowerCase() === 'manager') {
      rolesToSearch = ['manager', 'projectmanager'];
    }
    
    const users = await this.usersService.findByRoles(rolesToSearch);
    
    return users.map(user => ({
      id: user.id,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      role: {
        name: user.role?.name || '',
        displayName: user.role?.displayName || user.role?.name || ''
      }
    }));
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }
  
  @Get(':id/document')
  async getUserDocuments(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return user.document || [];
  }
  
  @Get(':id/bank-detail')
  async getUserBankDetails(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return user.bank_detail || [];
  }
  
  @Get(':id/education-detail')
  async getUserEducationDetails(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return user.education_detail || [];
  }
  
  @Get(':id/training-certificate')
  async getUserTrainingCertificates(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return user.trainning_detail || [];
  }
  
  @Post(':id/document')
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerOptionsHelper('public/document/user', 10000000, ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'])
    )
  )
  async uploadUserDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // If we have authenticated user info, pass it to track history
    const modifierUser = req.user ? await this.usersService.findOne(req.user.id) : null;

    return this.usersService.createDetail(
      id,
      'document', // Option type for documents
      {
        documentType: body.documentType || 'others',
        identificationNo: body.identificationNo,
        dateOfIssue: body.dateOfIssue,
        placeOfIssue: body.placeOfIssue,
        filename: file.originalname
      },
      file,
      'public/document/user',
      modifierUser
    );
  }
  
  @Get(':id/history')
  getUserHistory(
    @Param('id') id: string,
    @Query('actionType') actionType: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    let actionTypes = actionType ? [actionType] : undefined;
    
    // If multiple action types are requested
    if (actionType && actionType.includes(',')) {
      actionTypes = actionType.split(',') as HistoryActionType[];
    }
    
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    
    return this.userHistoryService.getFilteredUserHistory(
      id,
      actionTypes as HistoryActionType[],
      startDateObj,
      endDateObj
    );
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor(
      'user',
      multerOptionsHelper('public/images/document', 1000000)
    )
  )
  async update(
    @Param('id') id: string,
    @UploadedFile()
    file: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req
  ) {
    // If we have authenticated user info, pass it to track history
    const modifierUser = req.user ? await this.usersService.findOne(req.user.id) : null;
    
    return this.usersService.update(id, updateUserDto, modifierUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
  
  @Delete(':id/document/:documentId')
  async deleteUserDocument(
    @Param('id') userId: string,
    @Param('documentId') documentId: string,
    @Request() req
  ) {
    // Get the authenticated user for history tracking
    const modifierUser = req.user ? await this.usersService.findOne(req.user.id) : null;
    
    // First check if document exists and belongs to this user
    const document = await this.usersService.findUserDocument(userId, documentId);
    
    if (!document) {
      throw new BadRequestException('Document not found or does not belong to this user');
    }
    
    // Delete the document
    await this.usersService.deleteUserDocument(documentId, modifierUser);
    
    return { message: 'Document deleted successfully' };
  }
  
  // Activity endpoints have been moved to UserActivityController
  // This prevents route conflicts with dynamic parameters
  
  @Post(':id/document/:documentId/verify')
  async verifyUserDocument(
    @Param('id') userId: string,
    @Param('documentId') documentId: string,
    @Body() verifyData: { isVerified: boolean, verifiedAt?: string },
    @Request() req
  ) {
    // We need the authenticated user to be the verifier
    if (!req.user || !req.user.id) {
      throw new BadRequestException('Authentication required for verification');
    }
    
    const verifier = await this.usersService.findOne(req.user.id);
    
    // First check if document exists and belongs to this user
    const document = await this.usersService.findUserDocument(userId, documentId);
    
    if (!document) {
      throw new BadRequestException('Document not found or does not belong to this user');
    }
    
    // Update document verification status
    await this.documentRepository.update(documentId, {
      isVerified: verifyData.isVerified,
      verifiedById: verifier.id,
      verifiedAt: verifyData.verifiedAt ? new Date(verifyData.verifiedAt) : new Date()
    });
    
    // Record the verification action in history
    const user = await this.usersService.findOne(userId);
    await this.userHistoryService.createHistoryRecord(
      user,
      verifier,
      HistoryActionType.VERIFICATION,
      'document',
      document.isVerified ? 'Verified' : 'Unverified',
      verifyData.isVerified ? 'Verified' : 'Unverified',
      `Document ${document.documentType || ''} verification status updated by ${verifier.name}`
    );
    
    return { 
      message: 'Document verification status updated successfully',
      isVerified: verifyData.isVerified,
      verifiedAt: verifyData.verifiedAt || new Date().toISOString(),
      verifiedBy: verifier.name
    };
  }
  
  @Post(':id/bank-detail/:bankDetailId/verify')
  async verifyUserBankDetail(
    @Param('id') userId: string,
    @Param('bankDetailId') bankDetailId: string,
    @Body() verifyData: { isVerified: boolean, verifiedAt?: string },
    @Request() req
  ) {
    // We need the authenticated user to be the verifier
    if (!req.user || !req.user.id) {
      throw new BadRequestException('Authentication required for verification');
    }
    
    const verifier = await this.usersService.findOne(req.user.id);
    
    // First check if bank detail exists and belongs to this user
    const bankDetail = await this.usersService.findUserBankDetail(userId, bankDetailId);
    
    if (!bankDetail) {
      throw new BadRequestException('Bank detail not found or does not belong to this user');
    }
    
    // Update bank detail verification status
    await this.bankDetailRepository.update(bankDetailId, {
      isVerified: verifyData.isVerified,
      verifiedById: verifier.id,
      verifiedAt: verifyData.verifiedAt ? new Date(verifyData.verifiedAt) : new Date()
    });
    
    // Record the verification action in history
    const user = await this.usersService.findOne(userId);
    await this.userHistoryService.createHistoryRecord(
      user,
      verifier,
      HistoryActionType.VERIFICATION,
      'bank_detail',
      bankDetail.isVerified ? 'Verified' : 'Unverified',
      verifyData.isVerified ? 'Verified' : 'Unverified',
      `Bank detail (${bankDetail.bankName || ''}) verification status updated by ${verifier.name}`
    );
    
    return { 
      message: 'Bank detail verification status updated successfully',
      isVerified: verifyData.isVerified,
      verifiedAt: verifyData.verifiedAt || new Date().toISOString(),
      verifiedBy: verifier.name
    };
  }
  
  @Post(':id/education-detail/:educationDetailId/verify')
  async verifyUserEducationDetail(
    @Param('id') userId: string,
    @Param('educationDetailId') educationDetailId: string,
    @Body() verifyData: { isVerified: boolean, verifiedAt?: string },
    @Request() req
  ) {
    // We need the authenticated user to be the verifier
    if (!req.user || !req.user.id) {
      throw new BadRequestException('Authentication required for verification');
    }
    
    const verifier = await this.usersService.findOne(req.user.id);
    
    // First check if education detail exists and belongs to this user
    const educationDetail = await this.usersService.findUserEducationDetail(userId, educationDetailId);
    
    if (!educationDetail) {
      throw new BadRequestException('Education detail not found or does not belong to this user');
    }
    
    // Update education detail verification status
    await this.educationDetailRepository.update(educationDetailId, {
      isVerified: verifyData.isVerified,
      verifiedById: verifier.id,
      verifiedAt: verifyData.verifiedAt ? new Date(verifyData.verifiedAt) : new Date()
    });
    
    // Record the verification action in history
    const user = await this.usersService.findOne(userId);
    await this.userHistoryService.createHistoryRecord(
      user,
      verifier,
      HistoryActionType.VERIFICATION,
      'education_detail',
      educationDetail.isVerified ? 'Verified' : 'Unverified',
      verifyData.isVerified ? 'Verified' : 'Unverified',
      `Education detail (${educationDetail.universityCollege || ''}) verification status updated by ${verifier.name}`
    );
    
    return { 
      message: 'Education detail verification status updated successfully',
      isVerified: verifyData.isVerified,
      verifiedAt: verifyData.verifiedAt || new Date().toISOString(),
      verifiedBy: verifier.name
    };
  }
  
  @Post(':id/training-certificate/:trainingId/verify')
  async verifyUserTrainingCertificate(
    @Param('id') userId: string,
    @Param('trainingId') trainingId: string,
    @Body() verifyData: { isVerified: boolean, verifiedAt?: string },
    @Request() req
  ) {
    // We need the authenticated user to be the verifier
    if (!req.user || !req.user.id) {
      throw new BadRequestException('Authentication required for verification');
    }
    
    const verifier = await this.usersService.findOne(req.user.id);
    
    // First check if training certificate exists and belongs to this user
    const trainingCertificate = await this.usersService.findUserTrainingCertificate(userId, trainingId);
    
    if (!trainingCertificate) {
      throw new BadRequestException('Training certificate not found or does not belong to this user');
    }
    
    // Update training certificate verification status
    await this.trainingRepository.update(trainingId, {
      isVerified: verifyData.isVerified,
      verifiedById: verifier.id,
      verifiedAt: verifyData.verifiedAt ? new Date(verifyData.verifiedAt) : new Date()
    });
    
    // Record the verification action in history
    const user = await this.usersService.findOne(userId);
    await this.userHistoryService.createHistoryRecord(
      user,
      verifier,
      HistoryActionType.VERIFICATION,
      'training_certificate',
      trainingCertificate.isVerified ? 'Verified' : 'Unverified',
      verifyData.isVerified ? 'Verified' : 'Unverified',
      `Training certificate (${trainingCertificate.designationOfCourse || ''}) verification status updated by ${verifier.name}`
    );
    
    return { 
      message: 'Training certificate verification status updated successfully',
      isVerified: verifyData.isVerified,
      verifiedAt: verifyData.verifiedAt || new Date().toISOString(),
      verifiedBy: verifier.name
    };
  }
}
