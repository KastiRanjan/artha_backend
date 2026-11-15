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
import { ClientGroupsService } from './client-groups.service';
import { CreateClientGroupDto } from './dto/create-client-group.dto';
import { UpdateClientGroupDto } from './dto/update-client-group.dto';
import { CreateGroupContactDto } from './dto/create-group-contact.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';

@ApiTags('client-groups')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('client-groups')
@ApiBearerAuth()
export class ClientGroupsController {
  constructor(private readonly clientGroupsService: ClientGroupsService) {}

  @Post()
  create(@Body() createDto: CreateClientGroupDto, @GetUser() user?: UserEntity) {
    return this.clientGroupsService.create(createDto, user);
  }

  @Get()
  findAll() {
    return this.clientGroupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientGroupsService.findOne(id);
  }

  @Get(':id/ledger')
  getGroupLedger(@Param('id') id: string) {
    return this.clientGroupsService.getGroupLedger(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateClientGroupDto,
    @GetUser() user?: UserEntity
  ) {
    return this.clientGroupsService.update(id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientGroupsService.remove(id);
  }

  // --- Group Contacts Sub-endpoints ---

  @Post(':id/contacts')
  addContact(
    @Param('id') id: string,
    @Body() createContactDto: CreateGroupContactDto,
    @GetUser() user?: UserEntity
  ) {
    return this.clientGroupsService.addContact(id, createContactDto, user);
  }

  @Patch('contacts/:contactId')
  updateContact(
    @Param('contactId') contactId: string,
    @Body() updateContactDto: Partial<CreateGroupContactDto>,
    @GetUser() user?: UserEntity
  ) {
    return this.clientGroupsService.updateContact(contactId, updateContactDto, user);
  }

  @Delete('contacts/:contactId')
  removeContact(@Param('contactId') contactId: string) {
    return this.clientGroupsService.removeContact(contactId);
  }

  // --- Assign / Unassign Clients ---

  @Post(':id/assign-clients')
  assignClients(@Param('id') id: string, @Body('clientIds') clientIds: string[]) {
    return this.clientGroupsService.assignClients(id, clientIds);
  }

  @Post('unassign-client/:clientId')
  unassignClient(@Param('clientId') clientId: string) {
    return this.clientGroupsService.unassignClient(clientId);
  }
}
