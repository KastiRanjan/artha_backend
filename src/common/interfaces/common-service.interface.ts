import { CommonDtoInterface } from 'src/common/interfaces/common-dto.interface';
import { Pagination } from 'src/paginate';

/**
 * common service interface
 */
export interface CommonServiceInterface<T> {
  create(filter: CommonDtoInterface): Promise<T>;
  findAll(filter: CommonDtoInterface): Promise<Pagination<T>>;
  findOne(id: string): Promise<T>;
  update(id: string, inputDto: CommonDtoInterface): Promise<T>;
  remove(id: string): Promise<void>;
}
