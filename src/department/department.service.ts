import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentEntity } from './entities/department.entity';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private departmentRepository: Repository<DepartmentEntity>
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<DepartmentEntity> {
    const department = this.departmentRepository.create(createDepartmentDto);
    return await this.departmentRepository.save(department);
  }

  async findAll(): Promise<DepartmentEntity[]> {
    return await this.departmentRepository.find({
      order: {
        name: 'ASC'
      }
    });
  }

  async findActive(): Promise<DepartmentEntity[]> {
    return await this.departmentRepository.find({
      where: { isActive: true },
      order: {
        name: 'ASC'
      }
    });
  }

  async findOne(id: string): Promise<DepartmentEntity> {
    const department = await this.departmentRepository.findOne({
      where: { id }
    });
    
    if (!department) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }
    
    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<DepartmentEntity> {
    const department = await this.findOne(id);
    
    // Update properties
    if (updateDepartmentDto.name !== undefined) {
      department.name = updateDepartmentDto.name;
    }
    
    if (updateDepartmentDto.shortName !== undefined) {
      department.shortName = updateDepartmentDto.shortName;
    }
    
    return await this.departmentRepository.save(department);
  }

  async toggleActive(id: string, isActive: boolean): Promise<DepartmentEntity> {
    const department = await this.findOne(id);
    department.isActive = isActive;
    return await this.departmentRepository.save(department);
  }

  async remove(id: string): Promise<void> {
    const department = await this.findOne(id);
    await this.departmentRepository.remove(department);
  }
}