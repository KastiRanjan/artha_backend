import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessNature } from './entities/business-nature.entity';
import { CreateBusinessNatureDto } from './dto/create-business-nature.dto';
import { UpdateBusinessNatureDto } from './dto/update-business-nature.dto';

@Injectable()
export class BusinessNatureService {
  constructor(
    @InjectRepository(BusinessNature)
    private readonly businessNatureRepository: Repository<BusinessNature>,
  ) {}

  create(dto: CreateBusinessNatureDto) {
    const entity = this.businessNatureRepository.create(dto);
    return this.businessNatureRepository.save(entity);
  }

  findAll() {
    return this.businessNatureRepository.find();
  }

  findOne(id: string) {
    return this.businessNatureRepository.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateBusinessNatureDto) {
    return this.businessNatureRepository.update(id, dto);
  }

  remove(id: string) {
    return this.businessNatureRepository.delete(id);
  }
}
