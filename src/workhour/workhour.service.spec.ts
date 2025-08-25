import { Test, TestingModule } from '@nestjs/testing';
import { WorkhourService } from './workhour.service';

describe('WorkhourService', () => {
  let service: WorkhourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkhourService],
    }).compile();

    service = module.get<WorkhourService>(WorkhourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
