import { Test, TestingModule } from '@nestjs/testing';
import { TaskGroupsController } from './task-groups.controller';
import { TaskGroupsService } from './task-groups.service';

describe('TaskGroupsController', () => {
  let controller: TaskGroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskGroupsController],
      providers: [TaskGroupsService],
    }).compile();

    controller = module.get<TaskGroupsController>(TaskGroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
