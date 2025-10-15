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
import { ProjectEvaluationService } from './project-evaluation.service';
import { CreateProjectEvaluationDto } from './dto/create-project-evaluation.dto';
import { UpdateProjectEvaluationDto } from './dto/update-project-evaluation.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';

@ApiTags('project-evaluation')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('project-evaluation')
@ApiBearerAuth()
export class ProjectEvaluationController {
  constructor(
    private readonly projectEvaluationService: ProjectEvaluationService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create project evaluation for a user' })
  create(
    @Body() createDto: CreateProjectEvaluationDto,
    @GetUser() user: UserEntity
  ) {
    return this.projectEvaluationService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all evaluations' })
  findAll() {
    return this.projectEvaluationService.findAll();
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all evaluations for a project' })
  findByProject(@Param('projectId') projectId: string) {
    return this.projectEvaluationService.findByProject(projectId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all evaluations for a user' })
  findByUser(@Param('userId') userId: string) {
    return this.projectEvaluationService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single evaluation' })
  findOne(@Param('id') id: string) {
    return this.projectEvaluationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update evaluation' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProjectEvaluationDto,
    @GetUser() user: UserEntity
  ) {
    return this.projectEvaluationService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete evaluation' })
  remove(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.projectEvaluationService.remove(id, user);
  }
}
