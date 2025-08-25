import { Test, TestingModule } from '@nestjs/testing';
import { WorkhourController } from './workhour.controller';
import { WorkhourService } from './workhour.service';

describe('WorkhourController', () => {
  let controller: WorkhourController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkhourController],
      providers: [WorkhourService],
    }).compile();

    controller = module.get<WorkhourController>(WorkhourController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
