import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>
  ) {}
  async create(createProjectDto: CreateProjectDto) {
    const { users: userIds, ...projectData } = createProjectDto;
    // Fetch the user entities using the user IDs
    const users = await this.userRepository.findByIds(userIds);
    // Create a new project and assign the fetched users
    const project = this.projectRepository.create({
      ...projectData,
      users // Assign the user entities here
    });
    // Save the project with associated users
    return await this.projectRepository.save(project);
  }

  findAll() {
    return this.projectRepository.find({
      relations: ['users']
    });
  }

  findOne(id: number) {
    return this.projectRepository.findOne(id, { relations: ['users'] });
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    // return this.projectRepository.update(id, updateProjectDto);
  }

  remove(id: number) {
    return `This action removes a #${id} project`;
  }
  findByUserId(id: number) {
    return this.projectRepository.find({
      where: {
        users: {
          id: id
        }
      },
      relations: ['users']
    });
  }
}
