import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';

@ApiTags('client')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('clients')
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto, @GetUser() user?: UserEntity) {
    return this.customersService.create(createCustomerDto, user);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('status') status?: string) {
    if (status && status.toLowerCase() !== 'all') {
      return this.customersService.findByStatus(status);
    }
    return this.customersService.findAll();
  }

  @Get('similarity-check')
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'pan', required: false })
  @ApiQuery({ name: 'excludeId', required: false })
  checkSimilarity(
    @Query('name') name?: string,
    @Query('pan') pan?: string,
    @Query('excludeId') excludeId?: string
  ) {
    return this.customersService.checkSimilarity(name, pan, excludeId);
  }

  @Get('duplication-audit')
  getDuplicationAuditReport() {
    return this.customersService.getDuplicationAuditReport();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @GetUser() user?: UserEntity
  ) {
    return this.customersService.update(id, updateCustomerDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
