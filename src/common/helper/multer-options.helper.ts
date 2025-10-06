import { HttpStatus } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

import { CustomHttpException } from 'src/exception/custom-http.exception';
import { StatusCodesList } from 'src/common/constants/status-codes-list.constants';

export const multerOptionsHelper = (
  destinationPath: string,
  maxFileSize: number,
  allowedFileTypes: string[] = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
) => ({
  limits: {
    fileSize: +maxFileSize
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Create a regex pattern from allowed file types
    const pattern = new RegExp(`\\/(${allowedFileTypes.join('|')})$`, 'i');
    
    if (file.mimetype.match(pattern)) {
      cb(null, true);
    } else {
      cb(
        new CustomHttpException(
          `unsupportedFileType. Allowed types: ${allowedFileTypes.join(', ')}`,
          HttpStatus.BAD_REQUEST,
          StatusCodesList.UnsupportedFileType
        ),
        false
      );
    }
  },
  storage: diskStorage({
    destination: (req: any, file: any, cb: any) => {
      // Create folder if doesn't exist (recursively)
      if (!existsSync(destinationPath)) {
        mkdirSync(destinationPath, { recursive: true });
      }
      cb(null, destinationPath);
    },
    filename: (req: any, file: any, cb: any) => {
      cb(null, `${uuid()}${extname(file.originalname)}`);
    }
  })
});
