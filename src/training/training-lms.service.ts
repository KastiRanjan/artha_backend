import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { In, LessThanOrEqual, Not, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Request, Response } from 'express';
import { UserEntity } from 'src/auth/entity/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/enums/notification-type.enum';
import { UserTrainningEntity } from 'src/users/entities/user.trainingcertificate.entity';
import { TrainingCourseEntity } from './entities/training-course.entity';
import { TrainingModuleEntity } from './entities/training-module.entity';
import { TrainingLessonEntity } from './entities/training-lesson.entity';
import { TrainingAccessPolicyEntity } from './entities/training-access-policy.entity';
import { TrainingEnrollmentEntity } from './entities/training-enrollment.entity';
import { TrainingLessonProgressEntity } from './entities/training-lesson-progress.entity';
import {
  TrainingQuizAttemptEntity,
  TrainingQuizQuestionEntity,
} from './entities/training-quiz.entity';
import { TrainingLessonCommentEntity } from './entities/training-lesson-comment.entity';
import { TrainingCategoryEntity } from './entities/training-category.entity';
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

const MANAGER_AND_ABOVE = new Set([
  'manager',
  'projectmanager',
  'admin',
  'administrator',
  'superuser',
  'superadmin',
]);

const ADMIN_AND_SUPER = new Set([
  'admin',
  'administrator',
  'superuser',
  'superadmin',
]);

const PRIVATE_STORAGE_ROOT = path.resolve(
  process.cwd(),
  'storage',
  'training-private'
);

@Injectable()
export class TrainingLmsService {
  constructor(
    @InjectRepository(TrainingCourseEntity)
    private readonly courseRepo: Repository<TrainingCourseEntity>,
    @InjectRepository(TrainingModuleEntity)
    private readonly moduleRepo: Repository<TrainingModuleEntity>,
    @InjectRepository(TrainingLessonEntity)
    private readonly lessonRepo: Repository<TrainingLessonEntity>,
    @InjectRepository(TrainingAccessPolicyEntity)
    private readonly policyRepo: Repository<TrainingAccessPolicyEntity>,
    @InjectRepository(TrainingEnrollmentEntity)
    private readonly enrollmentRepo: Repository<TrainingEnrollmentEntity>,
    @InjectRepository(TrainingLessonProgressEntity)
    private readonly progressRepo: Repository<TrainingLessonProgressEntity>,
    @InjectRepository(TrainingQuizQuestionEntity)
    private readonly quizQuestionRepo: Repository<TrainingQuizQuestionEntity>,
    @InjectRepository(TrainingQuizAttemptEntity)
    private readonly quizAttemptRepo: Repository<TrainingQuizAttemptEntity>,
    @InjectRepository(TrainingLessonCommentEntity)
    private readonly commentRepo: Repository<TrainingLessonCommentEntity>,
    @InjectRepository(TrainingCategoryEntity)
    private readonly categoryRepo: Repository<TrainingCategoryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(UserTrainningEntity)
    private readonly userTrainingRepo: Repository<UserTrainningEntity>,
    private readonly notificationService: NotificationService
  ) {
    if (!fs.existsSync(PRIVATE_STORAGE_ROOT)) {
      fs.mkdirSync(PRIVATE_STORAGE_ROOT, { recursive: true });
    }
  }

  private getRoleName(user?: UserEntity | null): string {
    return (user?.role?.name || '').toLowerCase().trim();
  }

  private isManagerOrAbove(user?: UserEntity | null): boolean {
    return MANAGER_AND_ABOVE.has(this.getRoleName(user));
  }

  private isAdminOrSuper(user?: UserEntity | null): boolean {
    return ADMIN_AND_SUPER.has(this.getRoleName(user));
  }

  private assertCanAuthorCourse(
    course: TrainingCourseEntity,
    user: UserEntity
  ): void {
    if (!this.isManagerOrAbove(user)) {
      throw new ForbiddenException(
        'Only Managers and above can create or manage course content'
      );
    }
    if (
      !this.isAdminOrSuper(user) &&
      course.instructorId &&
      course.instructorId !== user.id &&
      course.createdBy !== user.id
    ) {
      throw new ForbiddenException(
        'You can only edit courses you created or instruct'
      );
    }
  }

  // ==========================================
  // TIMING WINDOW EVALUATION
  // ==========================================

  evaluateAccessWindow(
    policy: TrainingAccessPolicyEntity | null | undefined,
    user: UserEntity,
    course?: TrainingCourseEntity | null
  ): { allowed: boolean; reason?: string } {
    if (!policy || policy.mode === 'always') {
      return { allowed: true };
    }

    const roleName = this.getRoleName(user);
    const exempt = (policy.exemptRoles || []).map((r) => r.toLowerCase().trim());
    if (
      roleName === 'superuser' ||
      exempt.includes(roleName) ||
      (course && (course.instructorId === user.id || course.createdBy === user.id))
    ) {
      return { allowed: true };
    }

    const tz = policy.timezone || 'Asia/Kathmandu';
    const now = new Date();

    const dateFmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const currentDate = dateFmt.format(now); // YYYY-MM-DD

    if (policy.validFromDate && currentDate < policy.validFromDate) {
      return {
        allowed: false,
        reason: `Course access opens on ${policy.validFromDate}.`,
      };
    }
    if (policy.validUntilDate && currentDate > policy.validUntilDate) {
      return {
        allowed: false,
        reason: `Course access expired on ${policy.validUntilDate}.`,
      };
    }

    const weekdayStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
    }).format(now);
    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const currentDay = dayMap[weekdayStr] ?? now.getDay();

    const timeFmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const currentHHmm = timeFmt.format(now);

    const allowedDays = Array.isArray(policy.allowedDays) && policy.allowedDays.length > 0
      ? policy.allowedDays
      : [0, 1, 2, 3, 4, 5, 6];

    const start = policy.startTime || '00:00';
    const end = policy.endTime || '23:59';
    const inTimeRange =
      start <= end
        ? currentHHmm >= start && currentHHmm <= end
        : currentHHmm >= start || currentHHmm <= end;

    if (policy.mode === 'allow_window') {
      if (!allowedDays.includes(currentDay) || !inTimeRange) {
        return {
          allowed: false,
          reason: `Content is only accessible between ${start} and ${end} (${tz}) on scheduled days.`,
        };
      }
      return { allowed: true };
    }

    if (policy.mode === 'ban_window') {
      if (allowedDays.includes(currentDay) && inTimeRange) {
        return {
          allowed: false,
          reason: `Content access is restricted between ${start} and ${end} (${tz}).`,
        };
      }
      return { allowed: true };
    }

    return { allowed: true };
  }

  async upsertAccessPolicy(
    courseId: string,
    dto: UpsertAccessPolicyDto,
    user: UserEntity
  ) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    this.assertCanAuthorCourse(course, user);

    let policy = await this.policyRepo.findOne({ where: { courseId } });
    if (!policy) {
      policy = this.policyRepo.create({
        courseId,
        createdBy: user.id,
      });
    }

    Object.assign(policy, {
      mode: dto.mode,
      allowedDays: dto.allowedDays ?? policy.allowedDays ?? [0, 1, 2, 3, 4, 5, 6],
      startTime: dto.startTime ?? policy.startTime,
      endTime: dto.endTime ?? policy.endTime,
      timezone: dto.timezone || policy.timezone || 'Asia/Kathmandu',
      exemptRoles:
        dto.exemptRoles ?? policy.exemptRoles ?? ['superuser', 'administrator', 'admin'],
      validFromDate: dto.validFromDate ?? null,
      validUntilDate: dto.validUntilDate ?? null,
      policyNote: dto.policyNote ?? null,
      updatedBy: user.id,
    });

    return this.policyRepo.save(policy);
  }

  // ==========================================
  // MODULES & LESSONS (COURSE AUTHORING)
  // ==========================================

  async createModule(courseId: string, dto: CreateModuleDto, user: UserEntity) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    this.assertCanAuthorCourse(course, user);

    const existingCount = await this.moduleRepo.count({ where: { courseId } });
    const mod = this.moduleRepo.create({
      courseId,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      sortOrder: dto.sortOrder ?? existingCount + 1,
      isPublished: dto.isPublished ?? true,
      createdBy: user.id,
      updatedBy: user.id,
    });
    return this.moduleRepo.save(mod);
  }

  async updateModule(moduleId: string, dto: UpdateModuleDto, user: UserEntity) {
    const mod = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['course'],
    });
    if (!mod) throw new NotFoundException('Module not found');
    this.assertCanAuthorCourse(mod.course, user);

    Object.assign(mod, dto, { updatedBy: user.id });
    return this.moduleRepo.save(mod);
  }

  async deleteModule(moduleId: string, user: UserEntity) {
    const mod = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['course'],
    });
    if (!mod) throw new NotFoundException('Module not found');
    this.assertCanAuthorCourse(mod.course, user);

    await this.moduleRepo.remove(mod);
    return { message: 'Module deleted' };
  }

  async createLesson(moduleId: string, dto: CreateLessonDto, user: UserEntity) {
    const mod = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['course'],
    });
    if (!mod) throw new NotFoundException('Module not found');
    this.assertCanAuthorCourse(mod.course, user);

    const existingCount = await this.lessonRepo.count({ where: { moduleId } });
    const lesson = this.lessonRepo.create({
      moduleId,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      contentType: dto.contentType,
      richTextContent: dto.richTextContent,
      durationMinutes: dto.durationMinutes ?? 10,
      durationSeconds: dto.durationSeconds ?? (dto.durationMinutes ?? 10) * 60,
      sortOrder: dto.sortOrder ?? existingCount + 1,
      isRequired: dto.isRequired ?? true,
      passingScore: dto.passingScore ?? mod.course.passingScore ?? 70,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return this.lessonRepo.save(lesson);
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto, user: UserEntity) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course'],
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    this.assertCanAuthorCourse(lesson.module.course, user);

    Object.assign(lesson, dto, { updatedBy: user.id });
    return this.lessonRepo.save(lesson);
  }

  async deleteLesson(lessonId: string, user: UserEntity) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course'],
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    this.assertCanAuthorCourse(lesson.module.course, user);

    if (lesson.filePath) {
      const fullPath = path.resolve(PRIVATE_STORAGE_ROOT, lesson.filePath);
      if (fullPath.startsWith(PRIVATE_STORAGE_ROOT) && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await this.lessonRepo.remove(lesson);
    return { message: 'Lesson deleted' };
  }

  async uploadLessonFile(
    lessonId: string,
    file: Express.Multer.File,
    user: UserEntity
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course'],
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    this.assertCanAuthorCourse(lesson.module.course, user);

    const courseDir = path.join(PRIVATE_STORAGE_ROOT, lesson.module.courseId);
    if (!fs.existsSync(courseDir)) {
      fs.mkdirSync(courseDir, { recursive: true });
    }

    if (lesson.filePath) {
      const oldFull = path.resolve(PRIVATE_STORAGE_ROOT, lesson.filePath);
      if (oldFull.startsWith(PRIVATE_STORAGE_ROOT) && fs.existsSync(oldFull)) {
        fs.unlinkSync(oldFull);
      }
    }

    const ext = path.extname(file.originalname || '');
    const safeName = `${lesson.id}-${Date.now()}${ext}`;
    const relPath = path.join(lesson.module.courseId, safeName);
    const destPath = path.join(PRIVATE_STORAGE_ROOT, relPath);

    fs.writeFileSync(destPath, file.buffer);

    lesson.filePath = relPath;
    lesson.originalFileName = file.originalname;
    lesson.mimeType = file.mimetype;
    lesson.fileSizeBytes = file.size;
    lesson.updatedBy = user.id;

    await this.lessonRepo.save(lesson);
    return {
      id: lesson.id,
      originalFileName: lesson.originalFileName,
      mimeType: lesson.mimeType,
      fileSizeBytes: lesson.fileSizeBytes,
      hasFile: true,
    };
  }

  // ==========================================
  // QUIZ AUTHORING
  // ==========================================

  async addQuizQuestion(
    lessonId: string,
    dto: CreateQuizQuestionDto,
    user: UserEntity
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course'],
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    this.assertCanAuthorCourse(lesson.module.course, user);

    const count = await this.quizQuestionRepo.count({ where: { lessonId } });
    const q = this.quizQuestionRepo.create({
      lessonId,
      questionText: dto.questionText,
      questionType: dto.questionType || 'single',
      options: dto.options || [],
      points: dto.points ?? 1,
      sortOrder: dto.sortOrder ?? count + 1,
      createdBy: user.id,
    });
    return this.quizQuestionRepo.save(q);
  }

  async deleteQuizQuestion(questionId: string, user: UserEntity) {
    const q = await this.quizQuestionRepo.findOne({
      where: { id: questionId },
      relations: ['lesson', 'lesson.module', 'lesson.module.course'],
    });
    if (!q) throw new NotFoundException('Question not found');
    this.assertCanAuthorCourse(q.lesson.module.course, user);

    await this.quizQuestionRepo.remove(q);
    return { message: 'Question deleted' };
  }

  // ==========================================
  // ADMIN & SELF ENROLLMENT
  // ==========================================

  async adminEnrollCourse(
    courseId: string,
    dto: AdminEnrollCourseDto,
    adminUser: UserEntity
  ) {
    if (!this.isAdminOrSuper(adminUser)) {
      throw new ForbiddenException(
        'Only Admin or Super User can enroll students into courses'
      );
    }

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const users = await this.userRepo.find({
      where: { id: In(dto.userIds) },
    });

    const enrolled: TrainingEnrollmentEntity[] = [];
    for (const u of users) {
      const existing = await this.enrollmentRepo.findOne({
        where: { courseId, user: { id: u.id } },
      });
      if (existing) continue;

      const enrollment = this.enrollmentRepo.create({
        course,
        courseId,
        user: u,
        enrollmentType: 'nominated',
        nominatedBy: adminUser,
        status: 'enrolled',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdBy: adminUser.id,
      });
      const saved = await this.enrollmentRepo.save(enrollment);
      enrolled.push(saved);

      await this.notificationService
        .create({
          type: NotificationType.TRAINING,
          message: `You have been enrolled in "${course.title}" (${course.code}).`,
          link: `/training/learn/${course.id}`,
          users: [u.id],
          metadata: { courseId: course.id },
        })
        .catch(() => null);
    }

    return {
      enrolledCount: enrolled.length,
      enrollments: enrolled,
    };
  }

  async selfEnrollCourse(courseId: string, user: UserEntity) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    if (!course.allowSelfEnrollment && !this.isAdminOrSuper(user)) {
      throw new ForbiddenException(
        'Self-enrollment is disabled for this course. Please contact Admin.'
      );
    }

    const existing = await this.enrollmentRepo.findOne({
      where: { courseId, user: { id: user.id } },
    });
    if (existing) return existing;

    const enrollment = this.enrollmentRepo.create({
      course,
      courseId,
      user,
      enrollmentType: 'self',
      status: 'enrolled',
      createdBy: user.id,
    });
    return this.enrollmentRepo.save(enrollment);
  }

  async getCourseEnrollments(courseId: string, user: UserEntity) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    this.assertCanAuthorCourse(course, user);

    return this.enrollmentRepo.find({
      where: { courseId },
      relations: ['user', 'user.role', 'nominatedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMyCourseEnrollments(userId: string) {
    return this.enrollmentRepo.find({
      where: { user: { id: userId } },
      relations: ['course', 'course.accessPolicy', 'batch', 'batch.course'],
      order: { createdAt: 'DESC' },
    });
  }

  // ==========================================
  // COURSE PLAYER, STREAMING & PROGRESS
  // ==========================================

  private async resolveCourseAccess(courseId: string, user: UserEntity) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['accessPolicy', 'instructor'],
    });
    if (!course) throw new NotFoundException('Course not found');

    const enrollment = await this.enrollmentRepo.findOne({
      where: { courseId, user: { id: user.id } },
    });

    const isPrivileged =
      this.isAdminOrSuper(user) ||
      course.instructorId === user.id ||
      course.createdBy === user.id;

    if (!enrollment && !isPrivileged) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    const accessStatus = this.evaluateAccessWindow(
      course.accessPolicy,
      user,
      course
    );

    return { course, enrollment, isPrivileged, accessStatus };
  }

  async getCourseCurriculumForAuthor(courseId: string, user: UserEntity) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['accessPolicy', 'instructor'],
    });
    if (!course) throw new NotFoundException('Course not found');
    this.assertCanAuthorCourse(course, user);

    const modules = await this.moduleRepo.find({
      where: { courseId },
      relations: ['lessons', 'lessons.quizQuestions'],
      order: { sortOrder: 'ASC' },
    });

    modules.forEach((m) => {
      m.lessons = (m.lessons || [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((l) => ({
          ...l,
          quizQuestions: (l.quizQuestions || []).sort(
            (a, b) => a.sortOrder - b.sortOrder
          ),
        })) as any;
    });

    return {
      course,
      modules,
      accessPolicy: course.accessPolicy || null,
    };
  }

  async getCoursePlayerData(courseId: string, user: UserEntity) {
    const { course, enrollment, isPrivileged, accessStatus } =
      await this.resolveCourseAccess(courseId, user);

    const modules = await this.moduleRepo.find({
      where: { courseId, isPublished: true },
      relations: ['lessons', 'lessons.quizQuestions'],
      order: { sortOrder: 'ASC' },
    });

    const progressList = enrollment
      ? await this.progressRepo.find({ where: { enrollmentId: enrollment.id } })
      : [];
    const progressMap = new Map(progressList.map((p) => [p.lessonId, p]));

    let previousRequiredCompleted = true;

    const serializedModules = modules.map((mod) => {
      const sortedLessons = (mod.lessons || []).sort(
        (a, b) => a.sortOrder - b.sortOrder
      );

      const lessons = sortedLessons.map((lesson) => {
        const prog = progressMap.get(lesson.id);
        const isCompleted = prog?.status === 'completed';
        const isLocked =
          course.sequentialLock && !isPrivileged && !previousRequiredCompleted;

        if (lesson.isRequired && !isCompleted) {
          previousRequiredCompleted = false;
        }

        // Hide correct option answers from students
        const quizQuestions = (lesson.quizQuestions || [])
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((q) => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            points: q.points,
            options: (q.options || []).map((opt) => ({
              id: opt.id,
              text: opt.text,
            })),
          }));

        return {
          id: lesson.id,
          moduleId: lesson.moduleId,
          title: lesson.title,
          description: lesson.description,
          contentType: lesson.contentType,
          hasFile: Boolean(lesson.filePath),
          mimeType: lesson.mimeType,
          originalFileName: lesson.originalFileName,
          richTextContent: accessStatus.allowed && !isLocked ? lesson.richTextContent : null,
          durationMinutes: lesson.durationMinutes,
          durationSeconds: lesson.durationSeconds,
          sortOrder: lesson.sortOrder,
          isRequired: lesson.isRequired,
          passingScore: lesson.passingScore,
          quizQuestions: accessStatus.allowed && !isLocked ? quizQuestions : [],
          isLocked,
          progress: prog || {
            status: 'not_started',
            lastPositionSeconds: 0,
            watchedSeconds: 0,
            timeSpentSeconds: 0,
            completionPercent: 0,
          },
        };
      });

      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        sortOrder: mod.sortOrder,
        lessons,
      };
    });

    return {
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        cpdHours: course.cpdHours,
        strictSystemOnly: course.strictSystemOnly,
        sequentialLock: course.sequentialLock,
        passingScore: course.passingScore,
        instructor: course.instructor
          ? { id: course.instructor.id, name: course.instructor.name }
          : null,
      },
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            progressPercent: Number(enrollment.progressPercent || 0),
            lastLessonId: enrollment.lastLessonId,
            dueDate: enrollment.dueDate,
            certificateNumber: enrollment.certificateNumber,
            completedAt: enrollment.completedAt,
          }
        : null,
      accessStatus,
      accessPolicy: course.accessPolicy || null,
      modules: serializedModules,
    };
  }

  async streamLessonFile(
    lessonId: string,
    user: UserEntity,
    req: Request,
    res: Response
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course', 'module.course.accessPolicy'],
    });
    if (!lesson || !lesson.filePath) {
      throw new NotFoundException('Lesson content file not found');
    }

    const course = lesson.module.course;
    const { accessStatus } = await this.resolveCourseAccess(course.id, user);

    if (!accessStatus.allowed) {
      throw new ForbiddenException(
        accessStatus.reason || 'Access is restricted at this time'
      );
    }

    const fullPath = path.resolve(PRIVATE_STORAGE_ROOT, lesson.filePath);
    if (!fullPath.startsWith(PRIVATE_STORAGE_ROOT) || !fs.existsSync(fullPath)) {
      throw new NotFoundException('Content file missing on server');
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const mimeType = lesson.mimeType || 'application/octet-stream';
    const range = req.headers.range;

    res.setHeader('Content-Disposition', 'inline');
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', mimeType);

      fs.createReadStream(fullPath, { start, end }).pipe(res);
    } else {
      res.status(200);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', mimeType);
      fs.createReadStream(fullPath).pipe(res);
    }
  }

  async updateLessonProgress(
    lessonId: string,
    dto: UpdateLessonProgressDto,
    user: UserEntity
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course', 'module.course.accessPolicy'],
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const course = lesson.module.course;
    const { enrollment, accessStatus } = await this.resolveCourseAccess(
      course.id,
      user
    );

    if (!accessStatus.allowed) {
      throw new ForbiddenException(
        accessStatus.reason || 'Access is restricted at this time'
      );
    }

    if (!enrollment) {
      return { previewMode: true };
    }

    let progress = await this.progressRepo.findOne({
      where: { enrollmentId: enrollment.id, lessonId },
    });

    if (!progress) {
      progress = this.progressRepo.create({
        enrollmentId: enrollment.id,
        lessonId,
        createdBy: user.id,
      });
    }

    if (dto.lastPositionSeconds !== undefined) {
      progress.lastPositionSeconds = dto.lastPositionSeconds;
    }
    if (dto.watchedSeconds !== undefined) {
      progress.watchedSeconds = Math.max(
        progress.watchedSeconds || 0,
        dto.watchedSeconds
      );
    }
    if (dto.timeSpentSeconds !== undefined) {
      progress.timeSpentSeconds = Math.max(
        progress.timeSpentSeconds || 0,
        dto.timeSpentSeconds
      );
    }

    let nextPercent =
      dto.completionPercent !== undefined
        ? dto.completionPercent
        : Number(progress.completionPercent || 0);

    if (dto.status === 'completed' || nextPercent >= 90) {
      progress.status = 'completed';
      progress.completionPercent = 100;
      if (!progress.completedAt) {
        progress.completedAt = new Date();
      }
    } else if (
      dto.status === 'in_progress' ||
      nextPercent > 0 ||
      (dto.lastPositionSeconds ?? 0) > 0
    ) {
      if (progress.status !== 'completed') {
        progress.status = 'in_progress';
        progress.completionPercent = nextPercent;
      }
    }

    progress.updatedBy = user.id;
    await this.progressRepo.save(progress);

    enrollment.lastAccessedAt = new Date();
    enrollment.lastLessonId = lessonId;
    await this.recalculateCourseCompletion(enrollment, course, user);

    return {
      progress,
      enrollmentProgressPercent: Number(enrollment.progressPercent || 0),
      enrollmentStatus: enrollment.status,
      certificateNumber: enrollment.certificateNumber,
    };
  }

  async submitQuizAttempt(
    lessonId: string,
    dto: SubmitQuizAttemptDto,
    user: UserEntity
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: [
        'module',
        'module.course',
        'module.course.accessPolicy',
        'quizQuestions',
      ],
    });
    if (!lesson) throw new NotFoundException('Quiz lesson not found');

    const course = lesson.module.course;
    const { enrollment, accessStatus } = await this.resolveCourseAccess(
      course.id,
      user
    );
    if (!accessStatus.allowed) {
      throw new ForbiddenException(accessStatus.reason);
    }

    const questions = lesson.quizQuestions || [];
    if (questions.length === 0) {
      throw new BadRequestException('This quiz has no questions');
    }

    let totalPoints = 0;
    let earnedPoints = 0;

    for (const q of questions) {
      const pts = q.points || 1;
      totalPoints += pts;
      const correctIds = (q.options || [])
        .filter((o) => o.isCorrect)
        .map((o) => o.id)
        .sort();
      const userAns = (dto.answers?.[q.id] || []).slice().sort();
      if (JSON.stringify(correctIds) === JSON.stringify(userAns)) {
        earnedPoints += pts;
      }
    }

    const scorePercent =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passingScore = lesson.passingScore ?? course.passingScore ?? 70;
    const passed = scorePercent >= passingScore;

    if (enrollment) {
      await this.quizAttemptRepo.save(
        this.quizAttemptRepo.create({
          enrollmentId: enrollment.id,
          lessonId,
          scorePercent,
          passed,
          answers: dto.answers || {},
          createdBy: user.id,
        })
      );

      enrollment.quizScore = scorePercent;
      await this.enrollmentRepo.save(enrollment);

      if (passed) {
        await this.updateLessonProgress(
          lessonId,
          { status: 'completed', completionPercent: 100 },
          user
        );
      }
    }

    return {
      scorePercent,
      passingScore,
      passed,
      earnedPoints,
      totalPoints,
    };
  }

  private async recalculateCourseCompletion(
    enrollment: TrainingEnrollmentEntity,
    course: TrainingCourseEntity,
    user: UserEntity
  ) {
    const modules = await this.moduleRepo.find({
      where: { courseId: course.id, isPublished: true },
      relations: ['lessons'],
    });
    const requiredLessons = modules
      .flatMap((m) => m.lessons || [])
      .filter((l) => l.isRequired);

    if (requiredLessons.length === 0) {
      await this.enrollmentRepo.save(enrollment);
      return;
    }

    const progresses = await this.progressRepo.find({
      where: { enrollmentId: enrollment.id },
    });
    const completedSet = new Set(
      progresses.filter((p) => p.status === 'completed').map((p) => p.lessonId)
    );

    const completedRequired = requiredLessons.filter((l) =>
      completedSet.has(l.id)
    ).length;

    const percent = Math.round(
      (completedRequired / requiredLessons.length) * 100
    );
    enrollment.progressPercent = percent;

    if (percent >= 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.isPassed = true;
      enrollment.completedAt = new Date();
      if (!enrollment.certificateNumber) {
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        enrollment.certificateNumber = `CERT-${new Date().getFullYear()}-${randomPart}`;
      }

      await this.userTrainingRepo
        .save(
          this.userTrainingRepo.create({
            designationOfCourse: course.title.slice(0, 100),
            institute: 'Artha Academy (Self-Paced LMS)',
            year: new Date().getFullYear(),
            isVerified: true,
            user,
            createdBy: user.id,
          })
        )
        .catch(() => null);

      await this.notificationService
        .create({
          type: NotificationType.TRAINING,
          message: `Congratulations! You completed "${course.title}" (${enrollment.certificateNumber}).`,
          link: `/training/learn/${course.id}`,
          users: [user.id],
          metadata: { courseId: course.id, certificateNumber: enrollment.certificateNumber },
        })
        .catch(() => null);
    }

    await this.enrollmentRepo.save(enrollment);
  }

  // ==========================================
  // LESSON Q&A COMMENTS
  // ==========================================

  async getLessonComments(lessonId: string) {
    return this.commentRepo.find({
      where: { lessonId },
      relations: ['user', 'user.role'],
      order: { createdAt: 'ASC' },
    });
  }

  async createLessonComment(
    lessonId: string,
    dto: CreateLessonCommentDto,
    user: UserEntity
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course'],
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    await this.resolveCourseAccess(lesson.module.courseId, user);

    const comment = this.commentRepo.create({
      lessonId,
      userId: user.id,
      parentId: dto.parentId || null,
      content: dto.content.trim(),
      createdBy: user.id,
    });
    const saved = await this.commentRepo.save(comment);
    return this.commentRepo.findOne({
      where: { id: saved.id },
      relations: ['user', 'user.role'],
    });
  }

  // ==========================================
  // CATEGORIES (DYNAMIC)
  // ==========================================

  async getCategories() {
    return this.categoryRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createCategory(
    dto: { name: string; description?: string },
    user: UserEntity
  ) {
    if (!this.isManagerOrAbove(user)) {
      throw new ForbiddenException(
        'Only Managers and above can add course categories'
      );
    }
    const trimmed = (dto.name || '').trim();
    if (!trimmed) {
      throw new BadRequestException('Category name is required');
    }

    const existing = await this.categoryRepo
      .createQueryBuilder('cat')
      .where('LOWER(cat.name) = LOWER(:name)', { name: trimmed })
      .getOne();

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.updatedBy = user.id;
        return this.categoryRepo.save(existing);
      }
      throw new BadRequestException(`Category "${trimmed}" already exists`);
    }

    const cat = this.categoryRepo.create({
      name: trimmed,
      description: dto.description?.trim(),
      isActive: true,
      createdBy: user.id,
      updatedBy: user.id,
    });
    return this.categoryRepo.save(cat);
  }

  async deleteCategory(id: string, user: UserEntity) {
    if (this.getRoleName(user) !== 'superuser') {
      throw new ForbiddenException(
        'Only Super User is allowed to delete course categories'
      );
    }
    const existing = await this.categoryRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');
    await this.categoryRepo.remove(existing);
    return { message: 'Category deleted successfully' };
  }

  // ==========================================
  // ADMIN MONITORING
  // ==========================================

  async getAdminMonitoringEnrollments(user: UserEntity) {
    if (!this.isManagerOrAbove(user)) {
      throw new ForbiddenException(
        'Only Managers and above can view student monitoring'
      );
    }

    const isAdmin = this.isAdminOrSuper(user);
    const qb = this.enrollmentRepo
      .createQueryBuilder('enr')
      .leftJoinAndSelect('enr.user', 'student')
      .leftJoinAndSelect('student.role', 'studentRole')
      .leftJoinAndSelect('enr.course', 'course')
      .leftJoinAndSelect('enr.nominatedBy', 'nominatedBy')
      .leftJoinAndSelect('enr.lessonProgresses', 'lp')
      .where('enr.courseId IS NOT NULL')
      .orderBy('enr.updatedAt', 'DESC');

    if (!isAdmin) {
      qb.andWhere('(course.instructorId = :uid OR course.createdBy = :uidText)', {
        uid: user.id,
        uidText: String(user.id),
      });
    }

    const rows = await qb.getMany();
    return rows.map((enr) => {
      const totalTimeSpent = (enr.lessonProgresses || []).reduce(
        (sum, p) => sum + Number(p.timeSpentSeconds || 0),
        0
      );
      return {
        id: enr.id,
        courseId: enr.courseId,
        course: enr.course
          ? {
              id: enr.course.id,
              code: enr.course.code,
              title: enr.course.title,
              category: enr.course.category,
            }
          : null,
        student: enr.user
          ? {
              id: enr.user.id,
              name: enr.user.name,
              email: enr.user.email,
              role: enr.user.role?.displayName || enr.user.role?.name,
            }
          : null,
        enrollmentType: enr.enrollmentType,
        nominatedBy: enr.nominatedBy ? { id: enr.nominatedBy.id, name: enr.nominatedBy.name } : null,
        status: enr.status,
        progressPercent: Number(enr.progressPercent || 0),
        quizScore: enr.quizScore !== null && enr.quizScore !== undefined ? Number(enr.quizScore) : null,
        timeSpentSeconds: totalTimeSpent,
        dueDate: enr.dueDate,
        lastAccessedAt: enr.lastAccessedAt,
        completedAt: enr.completedAt,
        certificateNumber: enr.certificateNumber,
        createdAt: enr.createdAt,
      };
    });
  }

  async adminRemoveEnrollment(enrollmentId: string, user: UserEntity) {
    if (!this.isAdminOrSuper(user)) {
      throw new ForbiddenException('Only Admin or Super User can unenroll students');
    }
    const existing = await this.enrollmentRepo.findOne({ where: { id: enrollmentId } });
    if (!existing) throw new NotFoundException('Enrollment not found');
    await this.enrollmentRepo.remove(existing);
    return { message: 'Student unenrolled successfully' };
  }

  // ==========================================
  // DEADLINE REMINDERS CRON
  // ==========================================

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDeadlineReminders() {
    try {
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const dueEnrollments = await this.enrollmentRepo.find({
        where: {
          status: Not('completed'),
          dueDate: LessThanOrEqual(threeDaysFromNow),
        },
        relations: ['user', 'course'],
      });

      for (const enr of dueEnrollments) {
        if (!enr.user || !enr.course) continue;
        if (enr.lastReminderSentAt && enr.lastReminderSentAt > oneDayAgo) {
          continue;
        }
        await this.notificationService.create({
          type: NotificationType.TRAINING,
          message: `Reminder: Please complete "${enr.course.title}" (${Math.round(Number(enr.progressPercent || 0))}% completed).`,
          link: `/training/learn/${enr.courseId}`,
          users: [enr.user.id],
          metadata: { courseId: enr.courseId },
        });
        enr.lastReminderSentAt = new Date();
        await this.enrollmentRepo.save(enr);
      }
    } catch {
      // ignore scheduler errors
    }
  }
}
