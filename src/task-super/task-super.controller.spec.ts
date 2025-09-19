import { Test, TestingModule } from '@nestjs/testing';
import { TaskSuperController } from './task-super.controller';
import { TaskSuperService } from './task-super.service';

describe('TaskSuperController', () => {
  let controller: TaskSuperController;
  let service: TaskSuperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskSuperController],
      providers: [
        {
          provide: TaskSuperService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TaskSuperController>(TaskSuperController);
    service = module.get<TaskSuperService>(TaskSuperService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});