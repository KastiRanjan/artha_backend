import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptionsHelper } from 'src/common/helper/multer-options.helper';
import { DsaService } from './dsa.service';
import { CreateDsaDto } from './dto/create-dsa.dto';
import { ApproveDsaDto } from './dto/approve-dsa.dto';
import { SettleDsaDto } from './dto/settle-dsa.dto';
import { RejectDsaDto } from './dto/reject-dsa.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('dsa')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('dsa')
@ApiBearerAuth()
export class DsaController {
  constructor(private readonly dsaService: DsaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new DSA request' })
  create(@Body() createDsaDto: CreateDsaDto, @GetUser() user: UserEntity) {
    return this.dsaService.create(createDsaDto, user);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all DSA requests for a project' })
  findAllByProject(@Param('projectId') projectId: string, @GetUser() user: UserEntity) {
    return this.dsaService.findAllByProject(projectId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a DSA request by ID' })
  findOne(@Param('id') id: string) {
    return this.dsaService.findOne(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a DSA request' })
  approve(@Param('id') id: string, @Body() approveDsaDto: ApproveDsaDto, @GetUser() user: UserEntity) {
    return this.dsaService.approve(id, approveDsaDto, user);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a DSA request' })
  reject(@Param('id') id: string, @Body() rejectDsaDto: RejectDsaDto, @GetUser() user: UserEntity) {
    return this.dsaService.reject(id, rejectDsaDto, user);
  }

  @Patch(':id/settle')
  @ApiOperation({ summary: 'Settle a DSA request' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerOptionsHelper('public/document/dsa/bills', 10000000)
    )
  )
  settle(
    @Param('id') id: string,
    @Body() settleDsaDto: SettleDsaDto,
    @GetUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (file) {
      settleDsaDto.billImage = file.path.replace(/\\/g, '/').replace('public/', '');
    }
    return this.dsaService.settle(id, settleDsaDto, user);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify a DSA settlement' })
  verify(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.dsaService.verify(id, user);
  }
}
