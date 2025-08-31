import { Test, TestingModule } from '@nestjs/testing';
import { LeaveTypeService } from './leave-type.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveType } from './entities/leave-type.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('LeaveTypeService', () => {
  let service: LeaveTypeService;
  let repository: Repository<LeaveType>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveTypeService,
        {
          provide: getRepositoryToken(LeaveType),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<LeaveTypeService>(LeaveTypeService);
    repository = module.get<Repository<LeaveType>>(getRepositoryToken(LeaveType));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a leave type successfully', async () => {
      const createDto = {
        name: 'Annual Leave',
        description: 'Yearly vacation leave',
        maxDaysPerYear: 21,
        isActive: true,
      };

      const savedLeaveType = { id: '1', ...createDto, createdAt: new Date(), updatedAt: new Date() };
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(savedLeaveType as LeaveType);
      jest.spyOn(repository, 'save').mockResolvedValue(savedLeaveType as LeaveType);

      const result = await service.create(createDto);
      expect(result).toEqual(savedLeaveType);
    });

    it('should throw ConflictException if leave type with same name exists', async () => {
      const createDto = {
        name: 'Annual Leave',
        description: 'Yearly vacation leave',
        maxDaysPerYear: 21,
        isActive: true,
      };

      const existingLeaveType = { id: '1', ...createDto, createdAt: new Date(), updatedAt: new Date() };
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingLeaveType as LeaveType);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if leave type not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
