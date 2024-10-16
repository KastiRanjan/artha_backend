import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { Worklog } from './entities/worklog.entity';
import { UpdateWorklogDto } from './dto/update-worklog.dto';

@Injectable()
export class WorklogService {
  constructor(
    @InjectRepository(Worklog) private worklogRepository: Repository<Worklog>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Project) private projectRepository: Repository<Project>
  ) {}

  async create(createWorklog: CreateWorklogDto) {
    // const { users: userIds, ...worklogData } = createWorklog;
    // // Fetch the user entities using the user IDs
    // const users = await this.userRepository.findByIds(userIds);
    // // Create a new worklog and assign the fetched users
    // const worklog = this.worklogRepository.create({
    //   ...worklogData,
    //   users // Assign the user entities here
    // });
    // // Save the worklog with associated users
    // return await this.worklogRepository.save(worklog);
  }

  findAll() {
    return this.worklogRepository.find();
  }

  async findOne(id: number) {
    const worklog = await this.worklogRepository.findOne({
      where: { id }
    });
    if (!worklog) {
      throw new NotFoundException(`Worklog with ID ${id} not found`);
    }
    return worklog;
  }

  async update(id: number, updateWorklogDto: UpdateWorklogDto) {
    const worklog = await this.findOne(id);
    if (!worklog) {
      throw new NotFoundException(`Worklog with ID ${id} not found`);
    }
    Object.assign(worklog, updateWorklogDto);
    return this.worklogRepository.save(worklog);
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
