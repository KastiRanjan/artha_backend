import { Injectable } from '@nestjs/common';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';

@Injectable()
export class WorklogsService {
  create(createWorklogDto: CreateWorklogDto) {
    return 'This action adds a new worklog';
  }

  findAll() {
    return `This action returns all worklogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} worklog`;
  }

  update(id: number, updateWorklogDto: UpdateWorklogDto) {
    return `This action updates a #${id} worklog`;
  }

  remove(id: number) {
    return `This action removes a #${id} worklog`;
  }
}
