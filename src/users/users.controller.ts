import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from './users.service';
import { CreateUsersDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { multerOptionsHelper } from 'src/common/helper/multer-options.helper';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUsersDto: CreateUsersDto) {
    return this.usersService.create(createUsersDto);
  }
  @Post(':id')
  @UseInterceptors(
    FileInterceptor(
      'documentFile',
      multerOptionsHelper('public/document', 1000000)
    )
  )
  createDetail(
    @UploadedFile()
    file: Express.Multer.File,
    @Param('id') id: string,
    @Query('option') option: string,
    @Body()
    createUsersDto: any
  ) {
    return this.usersService.createDetail(id, option, createUsersDto, file);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor(
      'user',
      multerOptionsHelper('public/images/document', 1000000)
    )
  )
  update(
    @Param('id') id: string,
    @UploadedFile()
    file: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
