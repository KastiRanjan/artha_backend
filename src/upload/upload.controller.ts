import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { multerOptionsHelper } from 'src/common/helper/multer-options.helper';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('upload')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  @Post(':folder')
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerOptionsHelper('public/document', 10000000) // 10MB limit
    )
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('folder') folder: string
  ) {
    // File is automatically saved by the multer interceptor
    // Return the file path for the frontend to use
    const filePath = file.path.replace(/\\/g, '/').replace('public/', ''); // Remove 'public/' prefix
    
    return {
      success: true,
      message: 'File uploaded successfully',
      filePath: `/${filePath}`,
    };
  }
}