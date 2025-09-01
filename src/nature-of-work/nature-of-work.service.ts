import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatureOfWork } from './entities/nature-of-work.entity';
import { CreateNatureOfWorkDto } from './dto/create-nature-of-work.dto';
import { UpdateNatureOfWorkDto } from './dto/update-nature-of-work.dto';

@Injectable()
export class NatureOfWorkService {
  constructor(
    @InjectRepository(NatureOfWork)
    private readonly natureOfWorkRepository: Repository<NatureOfWork>,
  ) {}

  create(dto: CreateNatureOfWorkDto) {
    const entity = this.natureOfWorkRepository.create(dto);
    return this.natureOfWorkRepository.save(entity);
  }

  findAll() {
    return this.natureOfWorkRepository.find();
  }

  findOne(id: string) {
    return this.natureOfWorkRepository.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateNatureOfWorkDto) {
    return this.natureOfWorkRepository.update(id, dto);
  }

  remove(id: string) {
    return this.natureOfWorkRepository.delete(id);
  }
}
