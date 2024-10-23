import { Test, TestingModule } from '@nestjs/testing';
import { AttendenceController } from './attendence.controller';
import { AttendenceService } from './attendence.service';

describe('AttendenceController', () => {
  let controller: AttendenceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendenceController],
      providers: [AttendenceService],
    }).compile();

    controller = module.get<AttendenceController>(AttendenceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
