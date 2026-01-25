import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientReportDocumentTypeService } from './client-report-document-type.service';
import { 
  CreateClientReportDocumentTypeDto, 
  UpdateClientReportDocumentTypeDto,
  ClientReportDocumentTypeFilterDto 
} from './dto/client-report-document-type.dto';
import { PermissionGuard } from '../common/guard/permission.guard';
import JwtTwoFactorGuard from '../common/guard/jwt-two-factor.guard';

@ApiTags('client-report-document-type')
@Controller('client-report-document-type')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@ApiBearerAuth()
export class ClientReportDocumentTypeController {
  constructor(
    private readonly documentTypeService: ClientReportDocumentTypeService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client report document type' })
  @ApiResponse({ status: 201, description: 'Document type created successfully' })
  create(@Body(ValidationPipe) createDto: CreateClientReportDocumentTypeDto) {
    return this.documentTypeService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all document types' })
  findAll(@Query(ValidationPipe) filters?: ClientReportDocumentTypeFilterDto) {
    return this.documentTypeService.findAll(filters);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active document types' })
  findAllActive() {
    return this.documentTypeService.findAllActive();
  }

  @Get('global')
  @ApiOperation({ summary: 'Get all global document types' })
  findAllGlobal() {
    return this.documentTypeService.findAllGlobal();
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get document types for a specific customer (including global types)' })
  findForCustomer(@Param('customerId') customerId: string) {
    return this.documentTypeService.findForCustomer(customerId);
  }

  @Get('with-counts')
  @ApiOperation({ summary: 'Get document types with report counts' })
  getWithCounts(@Query('customerId') customerId?: string) {
    return this.documentTypeService.getDocumentTypesWithReportCounts(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document type by ID' })
  findOne(@Param('id') id: string) {
    return this.documentTypeService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a document type' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateClientReportDocumentTypeDto,
  ) {
    return this.documentTypeService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document type' })
  remove(@Param('id') id: string) {
    return this.documentTypeService.remove(id);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle document type active status' })
  toggleStatus(@Param('id') id: string) {
    return this.documentTypeService.toggleStatus(id);
  }
}
