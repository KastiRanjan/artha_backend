import { Test, TestingModule } from '@nestjs/testing';
import { LeaveTypeController } from './leave-type.controller';
import { LeaveTypeService } from './leave-type.service';

describe('LeaveTypeController', () => {
  let controller: LeaveTypeController;
  let service: LeaveTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveTypeController],
      providers: [
        {
          provide: LeaveTypeService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findAllActive: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            toggleStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LeaveTypeController>(LeaveTypeController);
    service = module.get<LeaveTypeService>(LeaveTypeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all leave types', async () => {
      const leaveTypes = [
        { id: '1', name: 'Annual Leave', maxDaysPerYear: 21, isActive: true },
        { id: '2', name: 'Sick Leave', maxDaysPerYear: 12, isActive: true },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(leaveTypes as any);

      const result = await controller.findAll();
      expect(result).toEqual(leaveTypes);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new leave type', async () => {
      const createDto = {
        name: 'Annual Leave',
        description: 'Yearly vacation leave',
        maxDaysPerYear: 21,
        isActive: true,
      };
      const createdLeaveType = { id: '1', ...createDto };

      jest.spyOn(service, 'create').mockResolvedValue(createdLeaveType as any);

      const result = await controller.create(createDto);
      expect(result).toEqual(createdLeaveType);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });
});
