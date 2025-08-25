import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from './entities/holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import * as csv from 'csv-parse/sync';

@Injectable()
export class HolidayService {
  constructor(
    @InjectRepository(Holiday)
    private readonly holidayRepository: Repository<Holiday>,
  ) {}

  async create(createHolidayDto: CreateHolidayDto): Promise<Holiday> {
    const holiday = this.holidayRepository.create(createHolidayDto);
    return this.holidayRepository.save(holiday);
  }

  async findAll(): Promise<Holiday[]> {
    return this.holidayRepository.find();
  }

  async findOne(id: string): Promise<Holiday> {
    const holiday = await this.holidayRepository.findOne({ where: { id } });
    if (!holiday) throw new NotFoundException('Holiday not found');
    return holiday;
  }

  async update(id: string, updateHolidayDto: UpdateHolidayDto): Promise<Holiday> {
    const holiday = await this.findOne(id);
    Object.assign(holiday, updateHolidayDto);
    return this.holidayRepository.save(holiday);
  }

  async remove(id: string): Promise<void> {
    const result = await this.holidayRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Holiday not found');
  }

  // Bulk CSV import logic
  async importCsv(file: Express.Multer.File): Promise<{ imported: number; errors: any[] }> {
    if (!file) throw new BadRequestException('No file uploaded');
    const records = this.parseCsv(file.buffer.toString());
    let imported = 0;
    const errors = [];
    for (const row of records) {
      try {
        const dto: CreateHolidayDto = {
          date: row.date,
          type: row.type,
          title: row.title,
          description: row.description,
          bsDate: row.bsDate,
        };
        await this.create(dto);
        imported++;
      } catch (e) {
        errors.push({ row, error: e.message });
      }
    }
    return { imported, errors };
  }

  async previewCsv(file: Express.Multer.File): Promise<any[]> {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.parseCsv(file.buffer.toString());
  }

  private parseCsv(csvString: string): any[] {
    // Expects header: date,type,title,description,bsDate
    return csv.parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }
}
