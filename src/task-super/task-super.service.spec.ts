import { Test, TestingModule } from '@nestjs/testing';
import { TaskSuperService } from './task-super.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskSuper } from './entities/task-super.entity';
import { Repository } from 'typeorm';

describe('TaskSuperService', () => {
  let service: TaskSuperService;
  let repository: Repository<TaskSuper>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskSuperService,
        {
          provide: getRepositoryToken(TaskSuper),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            merge: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskSuperService>(TaskSuperService);
    repository = module.get<Repository<TaskSuper>>(getRepositoryToken(TaskSuper));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});