import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calendar } from './entities/calendar.entity';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
  ) {}

  async create(createCalendarDto: CreateCalendarDto): Promise<Calendar> {
    const calendar = this.calendarRepository.create(createCalendarDto);
    return this.calendarRepository.save(calendar);
  }

  async findAll(): Promise<Calendar[]> {
    return this.calendarRepository.find();
  }

  async findOne(id: string): Promise<Calendar> {
    const calendar = await this.calendarRepository.findOne({ where: { id } });
    if (!calendar) throw new NotFoundException('Calendar entry not found');
    return calendar;
  }

  async update(id: string, updateCalendarDto: UpdateCalendarDto): Promise<Calendar> {
    const calendar = await this.findOne(id);
    Object.assign(calendar, updateCalendarDto);
    return this.calendarRepository.save(calendar);
  }

  async remove(id: string): Promise<void> {
    const result = await this.calendarRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Calendar entry not found');
  }

  async getMonth(year: string, month: string, calendarType: 'AD' | 'BS' = 'AD') {
    if (calendarType === 'AD') {
      // Find all entries for the given AD year and month
      const monthStr = month.padStart(2, '0');
      return this.calendarRepository.createQueryBuilder('calendar')
        .where('YEAR(calendar.date) = :year AND MONTH(calendar.date) = :month', { year, month: monthStr })
        .getMany();
    } else {
      // For BS, filter by bsDate string prefix (e.g., '2081-01')
      const prefix = `${year}-${month.padStart(2, '0')}`;
      return this.calendarRepository.createQueryBuilder('calendar')
        .where('calendar.bsDate LIKE :prefix', { prefix: `${prefix}%` })
        .getMany();
    }
  }
}
