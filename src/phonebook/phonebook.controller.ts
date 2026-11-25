import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserEntity } from 'src/auth/entity/user.entity';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { CreatePhonebookCategoryDto } from './dto/create-category.dto';
import { CreatePhonebookDto } from './dto/create-phonebook.dto';
import { UpdatePhonebookDto } from './dto/update-phonebook.dto';
import { PhonebookService } from './phonebook.service';

@ApiTags('phonebook')
@ApiBearerAuth()
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('phonebook')
export class PhonebookController {
  constructor(private readonly phonebookService: PhonebookService) {}

  @Get('clients')
  @ApiOperation({
    summary:
      'Get client contact person numbers (restricted to manager and above actively involved in current FY client projects, or superuser)'
  })
  getClientContacts(@GetUser() user: UserEntity) {
    return this.phonebookService.getClientContacts(user);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all active phonebook categories' })
  getCategories() {
    return this.phonebookService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new phonebook category' })
  createCategory(
    @Body() dto: CreatePhonebookCategoryDto,
    @GetUser() user: UserEntity
  ) {
    return this.phonebookService.createCategory(dto, user);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a phonebook category (superuser only)' })
  deleteCategory(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.phonebookService.deleteCategory(id, user);
  }

  @Get('share-options')
  @ApiOperation({ summary: 'Get active users and all roles for sharing selection' })
  getShareOptions() {
    return this.phonebookService.getShareOptions();
  }

  @Get()
  @ApiOperation({ summary: 'Get visible phonebook entries for the current user' })
  findAll(@GetUser() user: UserEntity) {
    return this.phonebookService.findAllEntries(user);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new phonebook entry' })
  create(@Body() dto: CreatePhonebookDto, @GetUser() user: UserEntity) {
    return this.phonebookService.createEntry(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a phonebook entry (creator or superuser)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePhonebookDto,
    @GetUser() user: UserEntity
  ) {
    return this.phonebookService.updateEntry(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a phonebook entry (superuser only)' })
  remove(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.phonebookService.deleteEntry(id, user);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get change history of a phonebook entry (superuser only)' })
  getHistory(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.phonebookService.getEntryHistory(id, user);
  }
}
