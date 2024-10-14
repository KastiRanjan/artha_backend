import { Test, TestingModule } from '@nestjs/testing';
import { WorklogsController } from './worklogs.controller';
import { WorklogsService } from './worklogs.service';

describe('WorklogsController', () => {
  let controller: WorklogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorklogsController],
      providers: [WorklogsService],
    }).compile();

    controller = module.get<WorklogsController>(WorklogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
