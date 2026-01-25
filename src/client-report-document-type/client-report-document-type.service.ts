import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClientReportDocumentType } from './entities/client-report-document-type.entity';
import { 
  CreateClientReportDocumentTypeDto, 
  UpdateClientReportDocumentTypeDto,
  ClientReportDocumentTypeFilterDto 
} from './dto/client-report-document-type.dto';

@Injectable()
export class ClientReportDocumentTypeService {
  constructor(
    @InjectRepository(ClientReportDocumentType)
    private documentTypeRepository: Repository<ClientReportDocumentType>,
  ) {}

  async create(createDto: CreateClientReportDocumentTypeDto): Promise<ClientReportDocumentType> {
    // Check if document type with same name already exists for the same customer
    const existingType = await this.documentTypeRepository.findOne({
      where: { 
        name: createDto.name,
        customerId: createDto.customerId || null,
        isGlobal: createDto.isGlobal || false
      }
    });

    if (existingType) {
      throw new ConflictException(`Document type with name '${createDto.name}' already exists`);
    }

    const documentType = this.documentTypeRepository.create(createDto);
    return this.documentTypeRepository.save(documentType);
  }

  async findAll(filters?: ClientReportDocumentTypeFilterDto): Promise<ClientReportDocumentType[]> {
    const queryBuilder = this.documentTypeRepository.createQueryBuilder('documentType')
      .leftJoinAndSelect('documentType.customer', 'customer')
      .orderBy('documentType.sortOrder', 'ASC')
      .addOrderBy('documentType.name', 'ASC');

    if (filters?.customerId) {
      if (filters.includeGlobal !== false) {
        // Get types for specific customer AND global types
        queryBuilder.where(
          '(documentType.customerId = :customerId OR documentType.isGlobal = true)',
          { customerId: filters.customerId }
        );
      } else {
        // Get only customer-specific types
        queryBuilder.where('documentType.customerId = :customerId', { 
          customerId: filters.customerId 
        });
      }
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('documentType.isActive = :isActive', { 
        isActive: filters.isActive 
      });
    }

    return queryBuilder.getMany();
  }

  async findAllActive(): Promise<ClientReportDocumentType[]> {
    return this.documentTypeRepository.find({
      where: { isActive: true },
      relations: ['customer'],
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  }

  async findAllGlobal(): Promise<ClientReportDocumentType[]> {
    return this.documentTypeRepository.find({
      where: { isGlobal: true, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  }

  async findForCustomer(customerId: string): Promise<ClientReportDocumentType[]> {
    // Returns both customer-specific and global document types
    return this.documentTypeRepository.find({
      where: [
        { customerId, isActive: true },
        { isGlobal: true, isActive: true }
      ],
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  }

  async findOne(id: string): Promise<ClientReportDocumentType> {
    const documentType = await this.documentTypeRepository.findOne({
      where: { id },
      relations: ['customer']
    });

    if (!documentType) {
      throw new NotFoundException(`Document type with ID ${id} not found`);
    }

    return documentType;
  }

  async update(id: string, updateDto: UpdateClientReportDocumentTypeDto): Promise<ClientReportDocumentType> {
    const documentType = await this.findOne(id);

    // Check if name is being updated and if it conflicts with existing
    if (updateDto.name && updateDto.name !== documentType.name) {
      const existingType = await this.documentTypeRepository.findOne({
        where: { 
          name: updateDto.name,
          customerId: updateDto.customerId || documentType.customerId || null
        }
      });

      if (existingType && existingType.id !== id) {
        throw new ConflictException(`Document type with name '${updateDto.name}' already exists`);
      }
    }

    Object.assign(documentType, updateDto);
    return this.documentTypeRepository.save(documentType);
  }

  async remove(id: string): Promise<void> {
    const documentType = await this.findOne(id);
    await this.documentTypeRepository.remove(documentType);
  }

  async toggleStatus(id: string): Promise<ClientReportDocumentType> {
    const documentType = await this.findOne(id);
    documentType.isActive = !documentType.isActive;
    return this.documentTypeRepository.save(documentType);
  }

  async getDocumentTypesWithReportCounts(customerId?: string): Promise<any[]> {
    const queryBuilder = this.documentTypeRepository.createQueryBuilder('documentType')
      .leftJoin('client_report', 'report', 'report.documentTypeId = documentType.id')
      .select([
        'documentType.id as id',
        'documentType.name as name',
        'documentType.description as description',
        'documentType.isGlobal as isGlobal',
        'documentType.isActive as isActive',
        'documentType.sortOrder as sortOrder',
        'COUNT(report.id) as reportCount'
      ])
      .groupBy('documentType.id')
      .orderBy('documentType.sortOrder', 'ASC');

    if (customerId) {
      queryBuilder.where(
        '(documentType.customerId = :customerId OR documentType.isGlobal = true)',
        { customerId }
      );
    }

    return queryBuilder.getRawMany();
  }
}
