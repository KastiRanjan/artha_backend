import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingCourseEntity } from './entities/training-course.entity';
import { TrainingBatchEntity } from './entities/training-batch.entity';
import { TrainingSessionEntity } from './entities/training-session.entity';
import { TrainingEnrollmentEntity } from './entities/training-enrollment.entity';
import { TrainingAttendanceEntity } from './entities/training-attendance.entity';
import { TrainingFeedbackEntity } from './entities/training-feedback.entity';
import { TrainingModuleEntity } from './entities/training-module.entity';
import { TrainingLessonEntity } from './entities/training-lesson.entity';
import { TrainingAccessPolicyEntity } from './entities/training-access-policy.entity';
import { TrainingLessonProgressEntity } from './entities/training-lesson-progress.entity';
import {
  TrainingQuizAttemptEntity,
  TrainingQuizQuestionEntity,
} from './entities/training-quiz.entity';
import { TrainingLessonCommentEntity } from './entities/training-lesson-comment.entity';
import { TrainingCategoryEntity } from './entities/training-category.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { UserTrainningEntity } from 'src/users/entities/user.trainingcertificate.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { TrainingService } from './training.service';
import { TrainingLmsService } from './training-lms.service';
import { TrainingController } from './training.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingCourseEntity,
      TrainingBatchEntity,
      TrainingSessionEntity,
      TrainingEnrollmentEntity,
      TrainingAttendanceEntity,
      TrainingFeedbackEntity,
      TrainingModuleEntity,
      TrainingLessonEntity,
      TrainingAccessPolicyEntity,
      TrainingLessonProgressEntity,
      TrainingQuizQuestionEntity,
      TrainingQuizAttemptEntity,
      TrainingLessonCommentEntity,
      TrainingCategoryEntity,
      UserEntity,
      UserTrainningEntity,
    ]),
    NotificationModule,
  ],
  controllers: [TrainingController],
  providers: [TrainingService, TrainingLmsService],
  exports: [TrainingService, TrainingLmsService],
})
export class TrainingModule {}
