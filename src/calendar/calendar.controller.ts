import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { CalendarUtil } from './calendar.util';
import { CalendarService } from './calendar.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';

@ApiTags('calendar')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)  
@Controller('calendar')
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  create(@Body() createCalendarDto: CreateCalendarDto) {
    return this.calendarService.create(createCalendarDto);
  }

  @Get()
  findAll() {
    return this.calendarService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCalendarDto: UpdateCalendarDto) {
    return this.calendarService.update(id, updateCalendarDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calendarService.remove(id);
  }

  // BS/AD conversion endpoints
  @Get('convert/ad-to-bs')
  adToBs(@Query('adDate') adDate: string) {
    return { bsDate: CalendarUtil.adToBs(adDate) };
  }

  @Get('convert/bs-to-ad')
  bsToAd(@Query('bsDate') bsDate: string) {
    return { adDate: CalendarUtil.bsToAd(bsDate) };
  }

  // Calendar query by month/year (AD or BS)
  @Get('month')
  getMonth(@Query('year') year: string, @Query('month') month: string, @Query('calendarType') calendarType: 'AD' | 'BS' = 'AD') {
    // For now, just return all entries for the month; can be enhanced
    return this.calendarService.getMonth(year, month, calendarType);
  }
}
