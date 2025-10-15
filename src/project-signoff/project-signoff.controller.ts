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
import { ProjectSignoffService } from './project-signoff.service';
import { CreateProjectSignoffDto } from './dto/create-project-signoff.dto';
import { UpdateProjectSignoffDto } from './dto/update-project-signoff.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';

@ApiTags('project-signoff')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('project-signoff')
@ApiBearerAuth()
export class ProjectSignoffController {
  constructor(
    private readonly projectSignoffService: ProjectSignoffService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create project sign-off (manager only)' })
  create(
    @Body() createDto: CreateProjectSignoffDto,
    @GetUser() user: UserEntity
  ) {
    return this.projectSignoffService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sign-offs' })
  findAll() {
    return this.projectSignoffService.findAll();
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get sign-off for a project' })
  findByProject(@Param('projectId') projectId: string) {
    return this.projectSignoffService.findByProject(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single sign-off' })
  findOne(@Param('id') id: string) {
    return this.projectSignoffService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sign-off' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProjectSignoffDto,
    @GetUser() user: UserEntity
  ) {
    return this.projectSignoffService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sign-off' })
  remove(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.projectSignoffService.remove(id, user);
  }
}
