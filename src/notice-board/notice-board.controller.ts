import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { NoticeBoardService } from './notice-board.service';
import { CreateNoticeBoardDto } from './dto/create-notice-board.dto';
import { UpdateNoticeBoardDto } from './dto/update-notice-board.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptionsHelper } from 'src/common/helper/multer-options.helper';
import { PermissionGuard } from 'src/common/guard/permission.guard';

@ApiTags('notice-board')
@UseGuards(JwtAuthGuard,PermissionGuard)
@Controller('notice-board')
export class NoticeBoardController {
  constructor(private readonly noticeBoardService: NoticeBoardService) {}

  @Post()
  create(@Body() createNoticeBoardDto: CreateNoticeBoardDto, @Request() req) {
    console.log('Create Notice Board DTO:', JSON.stringify(createNoticeBoardDto));
    console.log('Send email flag in controller:', createNoticeBoardDto.sendEmail, typeof createNoticeBoardDto.sendEmail);
    console.log('Raw request body:', JSON.stringify(req.body));
    return this.noticeBoardService.create(createNoticeBoardDto, req.user);
  }

  @Get()
  findAll() {
    return this.noticeBoardService.findAll();
  }

  @Get('my-notices')
  findMyNotices(@Request() req) {
    return this.noticeBoardService.findAllForUser(req.user.id);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerOptionsHelper('public/document/notice-board', 5000000) // 5MB limit
    )
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    // File is automatically saved by the multer interceptor
    // Return the file path for the frontend to use
    const filePath = file.path.replace(/\\/g, '/').replace('public/', ''); // Remove 'public/' prefix
    
    return {
      success: true,
      message: 'Image uploaded successfully',
      imagePath: `/${filePath}`,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noticeBoardService.findOne(id);
  }

  @Get(':id/statistics')
  getReadStatistics(@Param('id') id: string) {
    return this.noticeBoardService.getReadStatistics(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNoticeBoardDto: UpdateNoticeBoardDto, @Request() req) {
    console.log('Update Notice Board DTO:', JSON.stringify(updateNoticeBoardDto));
    console.log('Send email flag in controller update:', updateNoticeBoardDto.sendEmail, typeof updateNoticeBoardDto.sendEmail);
    console.log('Raw update request body:', JSON.stringify(req.body));
    return this.noticeBoardService.update(id, updateNoticeBoardDto);
  }

  @Patch(':id/mark-as-read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.noticeBoardService.markAsRead(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticeBoardService.remove(id);
  }
}