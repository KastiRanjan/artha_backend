import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards
} from '@nestjs/common';
import { LegalStatusService } from './legal-status.service';
import { CreateLegalStatusDto } from './dto/create-legal-status.dto';
import { UpdateLegalStatusDto } from './dto/update-legal-status.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';

@ApiTags('legal-status')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('legal-status')
@ApiBearerAuth()
export class LegalStatusController {
  constructor(private readonly legalStatusService: LegalStatusService) {}

  @Post()
  create(@Body() createLegalStatusDto: CreateLegalStatusDto) {
    return this.legalStatusService.create(createLegalStatusDto);
  }

  @Get()
  findAll() {
    return this.legalStatusService.findAll();
  }

  @Get('active')
  findActive() {
    return this.legalStatusService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.legalStatusService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLegalStatusDto: UpdateLegalStatusDto
  ) {
    return this.legalStatusService.update(id, updateLegalStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.legalStatusService.remove(id);
  }
}
