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
    const { users: userIds,projectLead, ...projectData } = createProjectDto;
    // Fetch the user entities using the user IDs
    const users = await this.userRepository.findByIds(userIds);
    const user = await this.userRepository.findOne({id: projectLead});
    // Create a new project and assign the fetched users
    const project = this.projectRepository.create({
      ...projectData,
      users, 
      projectLead:user,
    });
    // Save the project with associated users
    return await this.projectRepository.save(project);
  }

  findAll() {
    return this.projectRepository.find({
      relations: ['projectLead']});
  }

  findOne(id: string) {
    return this.projectRepository.findOne(id, {
      relations: ['users', 'tasks']
    });
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    // Find the project by its ID
    const project = await this.projectRepository.findOne(id, {
      relations: ['users']
    });

    // If the project is not found, you can throw an error or handle it accordingly
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Update project properties with the new values
    Object.assign(project, updateProjectDto);

    // If there are user updates, handle them
    if (updateProjectDto.users) {
      const users = await this.userRepository.findByIds(updateProjectDto.users);
      project.users = users; // Update users if provided
    }

    // Save the updated project back to the repository
    return await this.projectRepository.save(project);
  }

  async remove(id: string) {
    // Find the project by its ID
    const project = await this.projectRepository.findOne(id);

    // If the project is not found, you can throw an error or handle it accordingly
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Remove the project
    await this.projectRepository.remove(project);

    // Optionally, return a success message or the removed project
    return { message: `Project with ID ${id} removed successfully` };
  }
  findByUserId(id: string) {
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
