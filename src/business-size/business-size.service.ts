import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessSize } from './entities/business-size.entity';
import { CreateBusinessSizeDto } from './dto/create-business-size.dto';
import { UpdateBusinessSizeDto } from './dto/update-business-size.dto';

@Injectable()
export class BusinessSizeService {
  constructor(
    @InjectRepository(BusinessSize)
    private readonly businessSizeRepository: Repository<BusinessSize>,
  ) {}

  create(dto: CreateBusinessSizeDto) {
    const entity = this.businessSizeRepository.create(dto);
    return this.businessSizeRepository.save(entity);
  }

  findAll() {
    return this.businessSizeRepository.find();
  }

  findOne(id: string) {
    return this.businessSizeRepository.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateBusinessSizeDto) {
    return this.businessSizeRepository.update(id, dto);
  }

  remove(id: string) {
    return this.businessSizeRepository.delete(id);
  }
}
