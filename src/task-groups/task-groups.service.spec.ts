import { Test, TestingModule } from '@nestjs/testing';
import { TaskGroupsService } from './task-groups.service';

describe('TaskGroupsService', () => {
  let service: TaskGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskGroupsService],
    }).compile();

    service = module.get<TaskGroupsService>(TaskGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
