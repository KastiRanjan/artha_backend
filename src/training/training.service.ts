import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingCourseEntity } from './entities/training-course.entity';
import { TrainingBatchEntity } from './entities/training-batch.entity';
import { TrainingSessionEntity } from './entities/training-session.entity';
import { TrainingEnrollmentEntity } from './entities/training-enrollment.entity';
import { TrainingAttendanceEntity } from './entities/training-attendance.entity';
import { TrainingFeedbackEntity } from './entities/training-feedback.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { UserTrainningEntity } from 'src/users/entities/user.trainingcertificate.entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/enums/notification-type.enum';
import { CalendarUtil } from 'src/calendar/calendar.util';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { NominateUsersDto } from './dto/enroll-training.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(TrainingCourseEntity)
    private readonly courseRepo: Repository<TrainingCourseEntity>,
    @InjectRepository(TrainingBatchEntity)
    private readonly batchRepo: Repository<TrainingBatchEntity>,
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionRepo: Repository<TrainingSessionEntity>,
    @InjectRepository(TrainingEnrollmentEntity)
    private readonly enrollmentRepo: Repository<TrainingEnrollmentEntity>,
    @InjectRepository(TrainingAttendanceEntity)
    private readonly attendanceRepo: Repository<TrainingAttendanceEntity>,
    @InjectRepository(TrainingFeedbackEntity)
    private readonly feedbackRepo: Repository<TrainingFeedbackEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(UserTrainningEntity)
    private readonly userTrainingRepo: Repository<UserTrainningEntity>,
    private readonly notificationService: NotificationService,
  ) {}

  // ==========================================
  // 1. COURSES CATALOG
  // ==========================================

  private assertManagerOrAbove(user?: UserEntity | null) {
    const roleName = (user?.role?.name || '').toLowerCase().trim();
    const allowed = ['manager', 'projectmanager', 'admin', 'administrator', 'superuser', 'superadmin'];
    if (!allowed.includes(roleName)) {
      throw new ForbiddenException('Only Managers and above can create or manage courses');
    }
  }

  async createCourse(dto: CreateCourseDto, creator: UserEntity): Promise<TrainingCourseEntity> {
    this.assertManagerOrAbove(creator);
    const existing = await this.courseRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException(`Course with code "${dto.code}" already exists.`);
    }

    const strictSystemOnly = dto.strictSystemOnly !== undefined ? dto.strictSystemOnly : true;
    const course = this.courseRepo.create({
      ...dto,
      strictSystemOnly,
      materialsUrl: strictSystemOnly ? null : dto.materialsUrl,
      instructorId: dto.instructorId || creator?.id,
      createdBy: creator?.id,
    });
    return this.courseRepo.save(course);
  }

  async findAllCourses(query?: { category?: string; status?: string; search?: string }): Promise<TrainingCourseEntity[]> {
    const qb = this.courseRepo.createQueryBuilder('course')
      .leftJoinAndSelect('course.batches', 'batch')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .leftJoinAndSelect('course.accessPolicy', 'accessPolicy')
      .leftJoinAndSelect('course.modules', 'modules')
      .orderBy('course.createdAt', 'DESC');

    if (query?.category && query.category !== 'all') {
      qb.andWhere('LOWER(course.category) = LOWER(:category)', { category: query.category });
    }

    if (query?.status && query.status !== 'all') {
      qb.andWhere('course.status = :status', { status: query.status });
    }

    if (query?.search) {
      qb.andWhere('(LOWER(course.title) LIKE :search OR LOWER(course.code) LIKE :search OR LOWER(course.description) LIKE :search)', {
        search: `%${query.search.toLowerCase()}%`,
      });
    }

    return qb.getMany();
  }

  async findOneCourse(id: string): Promise<TrainingCourseEntity> {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['batches', 'batches.internalTrainer', 'batches.sessions', 'batches.enrollments'],
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async updateCourse(id: string, dto: UpdateCourseDto, modifier: UserEntity): Promise<TrainingCourseEntity> {
    this.assertManagerOrAbove(modifier);
    const course = await this.findOneCourse(id);
    const nextStrict = dto.strictSystemOnly !== undefined ? dto.strictSystemOnly : course.strictSystemOnly;
    Object.assign(course, dto, {
      strictSystemOnly: nextStrict,
      materialsUrl: nextStrict ? null : (dto.materialsUrl !== undefined ? dto.materialsUrl : course.materialsUrl),
      updatedBy: modifier?.id,
    });
    return this.courseRepo.save(course);
  }

  async removeCourse(id: string): Promise<{ message: string }> {
    const course = await this.findOneCourse(id);
    await this.courseRepo.remove(course);
    return { message: 'Course deleted successfully' };
  }

  // ==========================================
  // 2. BATCHES & SESSIONS
  // ==========================================

  async createBatch(dto: CreateBatchDto, creator: UserEntity): Promise<TrainingBatchEntity> {
    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');

    let trainer: UserEntity | null = null;
    if (dto.internalTrainerId) {
      trainer = await this.userRepo.findOne({ where: { id: dto.internalTrainerId } });
    }

    // Auto-calculate BS dates if not supplied
    const startDateNepali = dto.startDateNepali || (dto.startDate ? CalendarUtil.adToBs(dto.startDate) : undefined);
    const endDateNepali = dto.endDateNepali || (dto.endDate ? CalendarUtil.adToBs(dto.endDate) : undefined);

    const batch = this.batchRepo.create({
      course,
      batchName: dto.batchName,
      deliveryMode: dto.deliveryMode || 'in_person',
      venueOrLink: dto.venueOrLink,
      maxCapacity: dto.maxCapacity || 30,
      internalTrainer: trainer || undefined,
      externalTrainerName: dto.externalTrainerName,
      externalTrainerOrg: dto.externalTrainerOrg,
      startDate: dto.startDate,
      endDate: dto.endDate,
      startDateNepali,
      endDateNepali,
      status: dto.status || 'scheduled',
      createdBy: creator?.id,
    });

    const savedBatch = await this.batchRepo.save(batch);

    // Save individual sessions if provided
    if (dto.sessions && dto.sessions.length > 0) {
      const sessionEntities = dto.sessions.map((s) => {
        const sBs = s.dateNepali || (s.date ? CalendarUtil.adToBs(s.date) : undefined);
        return this.sessionRepo.create({
          batch: savedBatch,
          sessionNumber: s.sessionNumber,
          title: s.title,
          date: s.date,
          dateNepali: sBs,
          startTime: s.startTime || '10:00',
          endTime: s.endTime || '12:00',
          venueOrLink: s.venueOrLink || dto.venueOrLink,
          description: s.description,
          createdBy: creator?.id,
        });
      });
      await this.sessionRepo.save(sessionEntities);
    } else {
      // Default to 1 session on start date if none explicitly given
      const defaultSession = this.sessionRepo.create({
        batch: savedBatch,
        sessionNumber: 1,
        title: `${course.title} - Session 1`,
        date: dto.startDate,
        dateNepali: startDateNepali,
        startTime: '10:00',
        endTime: '12:00',
        venueOrLink: dto.venueOrLink,
        createdBy: creator?.id,
      });
      await this.sessionRepo.save(defaultSession);
    }

    return this.findOneBatch(savedBatch.id);
  }

  async findAllBatches(query?: { courseId?: string; status?: string }): Promise<TrainingBatchEntity[]> {
    const qb = this.batchRepo.createQueryBuilder('batch')
      .leftJoinAndSelect('batch.course', 'course')
      .leftJoinAndSelect('batch.internalTrainer', 'trainer')
      .leftJoinAndSelect('batch.sessions', 'session')
      .leftJoinAndSelect('batch.enrollments', 'enrollment')
      .leftJoinAndSelect('enrollment.user', 'enrolledUser')
      .orderBy('batch.startDate', 'DESC');

    if (query?.courseId) {
      qb.andWhere('batch.course.id = :courseId', { courseId: query.courseId });
    }

    if (query?.status && query.status !== 'all') {
      qb.andWhere('batch.status = :status', { status: query.status });
    }

    return qb.getMany();
  }

  async findOneBatch(id: string): Promise<TrainingBatchEntity> {
    const batch = await this.batchRepo.findOne({
      where: { id },
      relations: [
        'course',
        'internalTrainer',
        'sessions',
        'enrollments',
        'enrollments.user',
        'enrollments.nominatedBy',
        'enrollments.feedback',
      ],
    });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.sessions) {
      batch.sessions.sort((a, b) => a.sessionNumber - b.sessionNumber);
    }
    return batch;
  }

  async updateBatch(id: string, dto: UpdateBatchDto, modifier: UserEntity): Promise<TrainingBatchEntity> {
    const batch = await this.findOneBatch(id);
    if (dto.internalTrainerId) {
      const trainer = await this.userRepo.findOne({ where: { id: dto.internalTrainerId } });
      batch.internalTrainer = trainer;
    }
    Object.assign(batch, dto, { updatedBy: modifier?.id });
    await this.batchRepo.save(batch);
    return this.findOneBatch(id);
  }

  async removeBatch(id: string): Promise<{ message: string }> {
    const batch = await this.findOneBatch(id);
    await this.batchRepo.remove(batch);
    return { message: 'Batch removed successfully' };
  }

  // ==========================================
  // 3. ENROLLMENTS & NOMINATIONS
  // ==========================================

  async enrollSelf(batchId: string, user: UserEntity): Promise<TrainingEnrollmentEntity> {
    const batch = await this.findOneBatch(batchId);
    if (batch.status === 'completed' || batch.status === 'cancelled') {
      throw new BadRequestException('Cannot enroll in a completed or cancelled batch.');
    }

    const existing = await this.enrollmentRepo.findOne({
      where: { batch: { id: batchId }, user: { id: user.id } },
    });
    if (existing) {
      throw new BadRequestException('You are already enrolled in this batch.');
    }

    const currentEnrollmentCount = await this.enrollmentRepo.count({
      where: { batch: { id: batchId }, status: 'enrolled' },
    });

    const isWaitlisted = currentEnrollmentCount >= batch.maxCapacity;

    const enrollment = this.enrollmentRepo.create({
      batch,
      user,
      enrollmentType: 'self',
      status: isWaitlisted ? 'waitlisted' : 'enrolled',
      createdBy: user.id,
    });

    const saved = await this.enrollmentRepo.save(enrollment);

    // Send confirmation notification
    await this.notificationService.create({
      message: `Enrolled successfully in ${batch.course?.title || batch.batchName} (${isWaitlisted ? 'Waitlisted' : 'Confirmed'})`,
      link: `/training`,
      type: NotificationType.TRAINING,
      users: [user.id],
      metadata: { batchId, courseId: batch.course?.id },
    }).catch(() => {});

    return saved;
  }

  async nominateUsers(batchId: string, dto: NominateUsersDto, nominator: UserEntity): Promise<{ added: number; skipped: number }> {
    const batch = await this.findOneBatch(batchId);
    let added = 0;
    let skipped = 0;

    for (const uid of dto.userIds) {
      const u = await this.userRepo.findOne({ where: { id: uid } });
      if (!u) {
        skipped++;
        continue;
      }

      const existing = await this.enrollmentRepo.findOne({
        where: { batch: { id: batchId }, user: { id: uid } },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const enrollment = this.enrollmentRepo.create({
        batch,
        user: u,
        enrollmentType: 'nominated',
        nominatedBy: nominator,
        status: 'enrolled',
        createdBy: nominator.id,
      });

      await this.enrollmentRepo.save(enrollment);
      added++;

      // Notify nominated user
      await this.notificationService.create({
        message: `You have been nominated by ${nominator.name || 'Management'} for training: ${batch.course?.title || batch.batchName}`,
        link: `/training`,
        type: NotificationType.TRAINING,
        users: [uid],
        metadata: { batchId, courseId: batch.course?.id },
      }).catch(() => {});
    }

    return { added, skipped };
  }

  async cancelEnrollment(enrollmentId: string, user: UserEntity): Promise<{ message: string }> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['user'],
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (enrollment.user.id !== user.id && user.role?.name !== 'superuser' && user.role?.name !== 'administrator') {
      throw new BadRequestException('Not authorized to cancel this enrollment');
    }

    await this.enrollmentRepo.remove(enrollment);
    return { message: 'Enrollment cancelled successfully' };
  }

  async getMyEnrollments(userId: string): Promise<TrainingEnrollmentEntity[]> {
    return this.enrollmentRepo.find({
      where: { user: { id: userId } },
      relations: [
        'batch',
        'batch.course',
        'batch.internalTrainer',
        'batch.sessions',
        'attendances',
        'feedback',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // ==========================================
  // 4. ATTENDANCE TRACKING
  // ==========================================

  async getSessionAttendance(sessionId: string): Promise<TrainingAttendanceEntity[]> {
    return this.attendanceRepo.find({
      where: { session: { id: sessionId } },
      relations: ['user', 'enrollment'],
    });
  }

  async markAttendance(sessionId: string, dto: MarkAttendanceDto, marker: UserEntity): Promise<{ updated: number }> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['batch'],
    });
    if (!session) throw new NotFoundException('Session not found');

    let updated = 0;
    for (const rec of dto.records) {
      const user = await this.userRepo.findOne({ where: { id: rec.userId } });
      if (!user) continue;

      const enrollment = await this.enrollmentRepo.findOne({
        where: { batch: { id: session.batch.id }, user: { id: rec.userId } },
      });
      if (!enrollment) continue;

      let att = await this.attendanceRepo.findOne({
        where: { session: { id: sessionId }, user: { id: rec.userId } },
      });

      if (!att) {
        att = this.attendanceRepo.create({
          session,
          enrollment,
          user,
          status: rec.status,
          remarks: rec.remarks,
          createdBy: marker.id,
        });
      } else {
        att.status = rec.status;
        att.remarks = rec.remarks;
        att.updatedBy = marker.id;
      }

      await this.attendanceRepo.save(att);
      updated++;
    }

    // Mark session completed
    session.isCompleted = true;
    await this.sessionRepo.save(session);

    return { updated };
  }

  // ==========================================
  // 5. CERTIFICATES, FEEDBACK & PORTFOLIO
  // ==========================================

  async submitFeedback(enrollmentId: string, dto: SubmitFeedbackDto, user: UserEntity): Promise<TrainingFeedbackEntity> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['user', 'feedback'],
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.user.id !== user.id) {
      throw new BadRequestException('Not authorized to submit feedback for another user.');
    }

    let feedback = enrollment.feedback;
    if (!feedback) {
      feedback = this.feedbackRepo.create({
        enrollment,
        user,
        contentRating: dto.contentRating,
        trainerRating: dto.trainerRating,
        overallRating: dto.overallRating,
        comment: dto.comment,
        suggestions: dto.suggestions,
        createdBy: user.id,
      });
    } else {
      Object.assign(feedback, dto, { updatedBy: user.id });
    }

    return this.feedbackRepo.save(feedback);
  }

  async completeEnrollment(enrollmentId: string, adminUser: UserEntity): Promise<TrainingEnrollmentEntity> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['user', 'batch', 'batch.course'],
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const course = enrollment.batch?.course;
    const year = new Date().getFullYear();
    const certNum = `CERT-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

    enrollment.status = 'completed';
    enrollment.isPassed = true;
    enrollment.completedAt = new Date();
    enrollment.certificateNumber = certNum;
    enrollment.updatedBy = adminUser.id;

    const saved = await this.enrollmentRepo.save(enrollment);

    // Auto-sync into user profile's user_training table for lifetime HR records
    try {
      const profileCert = this.userTrainingRepo.create({
        user: enrollment.user,
        institute: 'Artha Practice & Professional Academy',
        designationOfCourse: course?.title || 'Professional Training',
        year: year,
        isVerified: true,
        verifiedById: adminUser.id,
        verifiedAt: new Date(),
        filename: certNum,
        createdBy: adminUser.id,
      });
      await this.userTrainingRepo.save(profileCert);
    } catch (err) {
      console.error('Failed to sync completed training to user profile:', err);
    }

    return saved;
  }

  async getMyCpdPortfolio(userId: string) {
    const enrollments = await this.enrollmentRepo.find({
      where: { user: { id: userId }, status: 'completed' },
      relations: ['batch', 'batch.course'],
    });

    let totalCpdHours = 0;
    const courseHistory = enrollments.map((e) => {
      const hours = Number(e.batch?.course?.cpdHours || 0);
      totalCpdHours += hours;
      return {
        enrollmentId: e.id,
        courseCode: e.batch?.course?.code,
        courseTitle: e.batch?.course?.title,
        category: e.batch?.course?.category,
        cpdHours: hours,
        certificateNumber: e.certificateNumber,
        completedAt: e.completedAt,
        batchName: e.batch?.batchName,
      };
    });

    return {
      userId,
      totalCompletedTrainings: enrollments.length,
      totalCpdHours,
      targetAnnualCpdHours: 30, // Standard ICAN/ACCA annual target
      courseHistory,
    };
  }

  async getTrainingAnalytics() {
    const totalCourses = await this.courseRepo.count();
    const totalBatches = await this.batchRepo.count();
    const totalEnrollments = await this.enrollmentRepo.count();
    const completedTrainings = await this.enrollmentRepo.count({ where: { status: 'completed' } });

    // Category breakdown
    const courses = await this.courseRepo.find({ select: ['category', 'cpdHours'] });
    const categoryCount: Record<string, number> = {};
    courses.forEach((c) => {
      categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
    });

    return {
      totalCourses,
      totalBatches,
      totalEnrollments,
      completedTrainings,
      categoryDistribution: categoryCount,
    };
  }
}
