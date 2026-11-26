import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';
import { TrainingService } from './training.service';
import { TrainingLmsService } from './training-lms.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { NominateUsersDto } from './dto/enroll-training.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import {
  AdminEnrollCourseDto,
  CreateLessonCommentDto,
  CreateLessonDto,
  CreateModuleDto,
  CreateQuizQuestionDto,
  SubmitQuizAttemptDto,
  UpdateLessonDto,
  UpdateLessonProgressDto,
  UpdateModuleDto,
  UpsertAccessPolicyDto,
} from './dto/lms.dto';

@ApiTags('training')
@ApiBearerAuth()
@UseGuards(JwtTwoFactorGuard)
@Controller('training')
export class TrainingController {
  constructor(
    private readonly trainingService: TrainingService,
    private readonly lmsService: TrainingLmsService,
  ) {}

  // ==========================================
  // CATEGORIES & ADMIN MONITORING
  // ==========================================

  @Get('categories')
  getCategories() {
    return this.lmsService.getCategories();
  }

  @Post('categories')
  createCategory(
    @Body() dto: { name: string; description?: string },
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.createCategory(dto, user);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.lmsService.deleteCategory(id, user);
  }

  @Get('monitoring/enrollments')
  getAdminMonitoringEnrollments(@GetUser() user: UserEntity) {
    return this.lmsService.getAdminMonitoringEnrollments(user);
  }

  @Delete('monitoring/enrollments/:id')
  adminRemoveEnrollment(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.lmsService.adminRemoveEnrollment(id, user);
  }

  // ==========================================
  // COURSES
  // ==========================================

  @Get('courses')
  findAllCourses(@Query() query: { category?: string; status?: string; search?: string }) {
    return this.trainingService.findAllCourses(query);
  }

  @Get('courses/:id')
  findOneCourse(@Param('id') id: string) {
    return this.trainingService.findOneCourse(id);
  }

  @Post('courses')
  createCourse(
    @Body(ValidationPipe) dto: CreateCourseDto,
    @GetUser() user: UserEntity,
  ) {
    return this.trainingService.createCourse(dto, user);
  }

  @Patch('courses/:id')
  updateCourse(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateCourseDto,
    @GetUser() user: UserEntity,
  ) {
    return this.trainingService.updateCourse(id, dto, user);
  }

  @Delete('courses/:id')
  removeCourse(@Param('id') id: string) {
    return this.trainingService.removeCourse(id);
  }

  // ==========================================
  // LMS CURRICULUM, TIMING POLICY & STREAMING
  // ==========================================

  @Get('courses/:courseId/curriculum')
  getCourseCurriculum(
    @Param('courseId') courseId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.getCourseCurriculumForAuthor(courseId, user);
  }

  @Post('courses/:courseId/modules')
  createModule(
    @Param('courseId') courseId: string,
    @Body(ValidationPipe) dto: CreateModuleDto,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.createModule(courseId, dto, user);
  }

  @Patch('modules/:moduleId')
  updateModule(
    @Param('moduleId') moduleId: string,
    @Body(ValidationPipe) dto: UpdateModuleDto,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.updateModule(moduleId, dto, user);
  }

  @Delete('modules/:moduleId')
  deleteModule(
    @Param('moduleId') moduleId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.deleteModule(moduleId, user);
  }

  @Post('modules/:moduleId/lessons')
  createLesson(
    @Param('moduleId') moduleId: string,
    @Body(ValidationPipe) dto: CreateLessonDto,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.createLesson(moduleId, dto, user);
  }

  @Patch('lessons/:lessonId')
  updateLesson(
    @Param('lessonId') lessonId: string,
    @Body(ValidationPipe) dto: UpdateLessonDto,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.updateLesson(lessonId, dto, user);
  }

  @Delete('lessons/:lessonId')
  deleteLesson(
    @Param('lessonId') lessonId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.deleteLesson(lessonId, user);
  }

  @Post('lessons/:lessonId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 250 * 1024 * 1024 },
    }),
  )
  uploadLessonFile(
    @Param('lessonId') lessonId: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.uploadLessonFile(lessonId, file, user);
  }

  @Get('lessons/:lessonId/stream')
  streamLessonFile(
    @Param('lessonId') lessonId: string,
    @GetUser() user: UserEntity,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.lmsService.streamLessonFile(lessonId, user, req, res);
  }

  @Post('courses/:courseId/access-policy')
  upsertAccessPolicy(
    @Param('courseId') courseId: string,
    @Body(ValidationPipe) dto: UpsertAccessPolicyDto,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.upsertAccessPolicy(courseId, dto, user);
  }

  // ==========================================
  // LMS COURSE ENROLLMENTS & PLAYER
  // ==========================================

  @Post('courses/:courseId/enroll-users')
  adminEnrollCourse(
    @Param('courseId') courseId: string,
    @Body(ValidationPipe) dto: AdminEnrollCourseDto,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.adminEnrollCourse(courseId, dto, user);
  }

  @Post('courses/:courseId/self-enroll')
  selfEnrollCourse(
    @Param('courseId') courseId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.selfEnrollCourse(courseId, user);
  }

  @Get('courses/:courseId/enrollments')
  getCourseEnrollments(
    @Param('courseId') courseId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.getCourseEnrollments(courseId, user);
  }

  @Get('my-courses')
  getMyCourseEnrollments(@GetUser() user: UserEntity) {
    return this.lmsService.getMyCourseEnrollments(user.id);
  }

  @Get('learn/:courseId')
  getCoursePlayerData(
    @Param('courseId') courseId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.getCoursePlayerData(courseId, user);
  }

  @Post('lessons/:lessonId/progress')
  updateLessonProgress(
    @Param('lessonId') lessonId: string,
    @Body(ValidationPipe) dto: UpdateLessonProgressDto,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.updateLessonProgress(lessonId, dto, user);
  }

  // ==========================================
  // QUIZZES & LESSON Q&A
  // ==========================================

  @Post('lessons/:lessonId/quiz-questions')
  addQuizQuestion(
    @Param('lessonId') lessonId: string,
    @Body(ValidationPipe) dto: CreateQuizQuestionDto,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.addQuizQuestion(lessonId, dto, user);
  }

  @Delete('quiz-questions/:questionId')
  deleteQuizQuestion(
    @Param('questionId') questionId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.deleteQuizQuestion(questionId, user);
  }

  @Post('lessons/:lessonId/quiz-attempt')
  submitQuizAttempt(
    @Param('lessonId') lessonId: string,
    @Body(ValidationPipe) dto: SubmitQuizAttemptDto,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.submitQuizAttempt(lessonId, dto, user);
  }

  @Get('lessons/:lessonId/comments')
  getLessonComments(@Param('lessonId') lessonId: string) {
    return this.lmsService.getLessonComments(lessonId);
  }

  @Post('lessons/:lessonId/comments')
  createLessonComment(
    @Param('lessonId') lessonId: string,
    @Body(ValidationPipe) dto: CreateLessonCommentDto,
    @GetUser() user: UserEntity,
  ) {
    return this.lmsService.createLessonComment(lessonId, dto, user);
  }

  // ==========================================
  // BATCHES
  // ==========================================

  @Get('batches')
  findAllBatches(@Query() query: { courseId?: string; status?: string }) {
    return this.trainingService.findAllBatches(query);
  }

  @Get('batches/:id')
  findOneBatch(@Param('id') id: string) {
    return this.trainingService.findOneBatch(id);
  }

  @Post('batches')
  createBatch(
    @Body(ValidationPipe) dto: CreateBatchDto,
    @GetUser() user: UserEntity,
  ) {
    return this.trainingService.createBatch(dto, user);
  }

  @Patch('batches/:id')
  updateBatch(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateBatchDto,
    @GetUser() user: UserEntity,
  ) {
    return this.trainingService.updateBatch(id, dto, user);
  }

  @Delete('batches/:id')
  removeBatch(@Param('id') id: string) {
    return this.trainingService.removeBatch(id);
  }

  // ==========================================
  // ENROLLMENT & NOMINATION (BATCHES)
  // ==========================================

  @Post('batches/:id/enroll')
  enrollSelf(
    @Param('id') batchId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.trainingService.enrollSelf(batchId, user);
  }

  @Post('batches/:id/nominate')
  nominateUsers(
    @Param('id') batchId: string,
    @Body(ValidationPipe) dto: NominateUsersDto,
    @GetUser() user: UserEntity,
  ) {
    return this.trainingService.nominateUsers(batchId, dto, user);
  }

  @Delete('enrollments/:id')
  cancelEnrollment(
    @Param('id') enrollmentId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.trainingService.cancelEnrollment(enrollmentId, user);
  }

  @Get('my-trainings')
  getMyTrainings(@GetUser() user: UserEntity) {
    return this.trainingService.getMyEnrollments(user.id);
  }

  @Get('my-portfolio')
  getMyCpdPortfolio(@GetUser() user: UserEntity) {
    return this.trainingService.getMyCpdPortfolio(user.id);
  }

  // ==========================================
  // ATTENDANCE
  // ==========================================

  @Get('sessions/:id/attendance')
  getSessionAttendance(@Param('id') sessionId: string) {
    return this.trainingService.getSessionAttendance(sessionId);
  }

  @Post('sessions/:id/attendance')
  markAttendance(
    @Param('id') sessionId: string,
    @Body(ValidationPipe) dto: MarkAttendanceDto,
    @GetUser() user: UserEntity,
  ) {
    return this.trainingService.markAttendance(sessionId, dto, user);
  }

  // ==========================================
  // FEEDBACK & COMPLETION
  // ==========================================

  @Post('enrollments/:id/feedback')
  submitFeedback(
    @Param('id') enrollmentId: string,
    @Body(ValidationPipe) dto: SubmitFeedbackDto,
    @GetUser() user: UserEntity,
  ) {
    return this.trainingService.submitFeedback(enrollmentId, dto, user);
  }

  @Post('enrollments/:id/complete')
  completeEnrollment(
    @Param('id') enrollmentId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.trainingService.completeEnrollment(enrollmentId, user);
  }

  @Get('analytics')
  getAnalytics() {
    return this.trainingService.getTrainingAnalytics();
  }
}
