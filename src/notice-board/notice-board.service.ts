import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNoticeBoardDto } from './dto/create-notice-board.dto';
import { UpdateNoticeBoardDto } from './dto/update-notice-board.dto';
import { NoticeBoard } from './entities/notice-board.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { RoleEntity } from 'src/role/entities/role.entity';
import { MailService } from 'src/mail/mail.service';
import { NotificationType } from 'src/notification/enums/notification-type.enum';

@Injectable()
export class NoticeBoardService {
  constructor(
    @InjectRepository(NoticeBoard)
    private readonly noticeBoardRepository: Repository<NoticeBoard>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly mailService: MailService,
  ) {}

  async create(createNoticeBoardDto: CreateNoticeBoardDto, currentUser: UserEntity) {
    console.log('Create DTO received:', JSON.stringify(createNoticeBoardDto));
    console.log('Send email flag:', createNoticeBoardDto.sendEmail, typeof createNoticeBoardDto.sendEmail);
    
    const noticeBoard = this.noticeBoardRepository.create({
      title: createNoticeBoardDto.title,
      description: createNoticeBoardDto.description,
      imagePath: createNoticeBoardDto.imagePath,
      sendToAll: createNoticeBoardDto.sendToAll,
    });

    // Assign users and roles
    if (createNoticeBoardDto.sendToAll) {
      // If sending to all, get all active users
      noticeBoard.users = await this.userRepository.find({ where: { status: 'active' } });
    } else {
      // Get specific users and users from selected roles
      const userPromises = [];
      const rolePromises = [];

      if (createNoticeBoardDto.userIds && createNoticeBoardDto.userIds.length > 0) {
        // Filter out invalid UUIDs
        const validUserIds = createNoticeBoardDto.userIds.filter(id => id && id !== 'undefined' && id !== 'null' && id !== 'NaN');
        if (validUserIds.length > 0) {
          userPromises.push(
            this.userRepository.findByIds(validUserIds)
          );
        }
      }

      if (createNoticeBoardDto.roleIds && createNoticeBoardDto.roleIds.length > 0) {
        // Filter out invalid UUIDs
        const validRoleIds = createNoticeBoardDto.roleIds.filter(id => id && id !== 'undefined' && id !== 'null' && id !== 'NaN');
        if (validRoleIds.length > 0) {
          rolePromises.push(
            this.roleRepository.findByIds(validRoleIds)
          );
          
          // Get users with these roles
          userPromises.push(
            this.userRepository
              .createQueryBuilder('user')
              .innerJoin('user.role', 'role')
              .where('role.id IN (:...roleIds)', { 
                roleIds: validRoleIds 
              })
              .getMany()
          );
        }
      }

      // Resolve all promises
      const userResults = await Promise.all(userPromises);
      const roleResults = await Promise.all(rolePromises);

      // Merge users from different sources and remove duplicates
      const userMap = new Map();
      userResults.flat().forEach(user => {
        userMap.set(user.id, user);
      });
      
      noticeBoard.users = Array.from(userMap.values());
      noticeBoard.roles = roleResults.flat();
    }

    // Save the notice board
    const savedNotice = await this.noticeBoardRepository.save(noticeBoard);

    // Send email if requested
    if (createNoticeBoardDto.sendEmail && savedNotice.users.length > 0) {
      console.log('Sending email notifications for notice:', savedNotice.id);
      const emailResult = await this.sendNoticeBoardEmails(savedNotice);
      console.log('Email sending result:', emailResult);
    } else {
      console.log('Not sending emails. sendEmail flag:', createNoticeBoardDto.sendEmail, 'User count:', savedNotice.users.length);
    }

    // Send real-time notification to all relevant users
    if (savedNotice.users && savedNotice.users.length > 0) {
      await (this as any).notificationService.create({
        users: savedNotice.users.map(u => u.id),
        message: `A notice has been published: "${savedNotice.title}"`,
        link: `/noticeboard/}`,
        type: NotificationType.NOTICEBOARD
      });
    }

    return savedNotice;
  }

  async findAll() {
    return this.noticeBoardRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['users', 'roles', 'readByUsers']
    });
  }

  async findAllForUser(userId: string) {
    // Get the user with their role
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Fetch notices where:
    // 1. Notice is sent to all users
    // 2. User is directly assigned to the notice
    // 3. User's role is assigned to the notice
    return this.noticeBoardRepository
      .createQueryBuilder('noticeBoard')
      .leftJoinAndSelect('noticeBoard.users', 'users')
      .leftJoinAndSelect('noticeBoard.roles', 'roles')
      .leftJoinAndSelect('noticeBoard.readByUsers', 'readByUsers')
      .where('noticeBoard.sendToAll = :sendToAll', { sendToAll: true })
      .orWhere(':userId IN (SELECT "userId" FROM notice_board_users WHERE "noticeBoardId" = noticeBoard.id)', { userId })
      .orWhere(':roleId IN (SELECT "roleId" FROM notice_board_roles WHERE "noticeBoardId" = noticeBoard.id)', { roleId: user.role.id })
      .orderBy('noticeBoard.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    const noticeBoard = await this.noticeBoardRepository.findOne({
      where: { id },
      relations: ['users', 'roles', 'readByUsers']
    });

    if (!noticeBoard) {
      throw new NotFoundException(`Notice board with ID ${id} not found`);
    }

    return noticeBoard;
  }

  async update(id: string, updateNoticeBoardDto: UpdateNoticeBoardDto) {
    const noticeBoard = await this.findOne(id);

    // Update basic fields
    if (updateNoticeBoardDto.title) noticeBoard.title = updateNoticeBoardDto.title;
    if (updateNoticeBoardDto.description) noticeBoard.description = updateNoticeBoardDto.description;
    if (updateNoticeBoardDto.imagePath !== undefined) noticeBoard.imagePath = updateNoticeBoardDto.imagePath;
    if (updateNoticeBoardDto.sendToAll !== undefined) noticeBoard.sendToAll = updateNoticeBoardDto.sendToAll;

    // Update users and roles
    if (updateNoticeBoardDto.sendToAll) {
      // If sending to all, get all active users
      noticeBoard.users = await this.userRepository.find({ where: { status: 'active' } });
      noticeBoard.roles = [];
    } else {
      // Update assigned users and roles if provided
      if (updateNoticeBoardDto.userIds) {
        // Filter out invalid UUIDs
        const validUserIds = updateNoticeBoardDto.userIds.filter(id => id && id !== 'undefined' && id !== 'null' && id !== 'NaN');
        if (validUserIds.length > 0) {
          noticeBoard.users = await this.userRepository.findByIds(validUserIds);
        } else {
          noticeBoard.users = [];
        }
      }
      
      if (updateNoticeBoardDto.roleIds) {
        // Filter out invalid UUIDs
        const validRoleIds = updateNoticeBoardDto.roleIds.filter(id => id && id !== 'undefined' && id !== 'null' && id !== 'NaN');
        if (validRoleIds.length > 0) {
          noticeBoard.roles = await this.roleRepository.findByIds(validRoleIds);
          
          // Get users with these roles and add them to the users list
          const usersWithRoles = await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.role', 'role')
            .where('role.id IN (:...roleIds)', { 
              roleIds: validRoleIds 
            })
            .getMany();
            
          // Merge users while removing duplicates
          const uniqueUsers = new Map();
          [...noticeBoard.users, ...usersWithRoles].forEach(user => {
            uniqueUsers.set(user.id, user);
          });
          
          noticeBoard.users = Array.from(uniqueUsers.values());
        } else {
          noticeBoard.roles = [];
        }
      }
    }

    // Send email if requested
    if (updateNoticeBoardDto.sendEmail && noticeBoard.users.length > 0) {
      console.log('Sending email notifications for updated notice:', noticeBoard.id);
      const emailResult = await this.sendNoticeBoardEmails(noticeBoard);
      console.log('Email sending result:', emailResult);
    } else {
      console.log('Not sending emails for update. sendEmail flag:', updateNoticeBoardDto.sendEmail, 'User count:', noticeBoard.users.length);
    }

    // Send real-time notification to all relevant users on update
    if (noticeBoard.users && noticeBoard.users.length > 0) {
      await (this as any).notificationService.create({
        users: noticeBoard.users.map(u => u.id),
        message: `Notice updated: "${noticeBoard.title}"`,
        link: `/noticeboard/${noticeBoard.id}`,
        type: NotificationType.NOTICEBOARD
      });
    }

    const updatedNotice = await this.noticeBoardRepository.save(noticeBoard);
    return updatedNotice;
  }

  async remove(id: string) {
    const result = await this.noticeBoardRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Notice board with ID ${id} not found`);
    }
    return { success: true, message: 'Notice board deleted successfully' };
  }

  async markAsRead(noticeId: string, userId: string) {
    const notice = await this.findOne(noticeId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user has already read this notice
    const isAlreadyRead = notice.readByUsers.some(readUser => readUser.id === userId);
    
    if (!isAlreadyRead) {
      // Add the user to readByUsers array
      await this.noticeBoardRepository
        .createQueryBuilder()
        .relation(NoticeBoard, 'readByUsers')
        .of(noticeId)
        .add(userId);
    }

    return { success: true, message: 'Notice marked as read' };
  }

  async getReadStatistics(noticeId: string) {
    const notice = await this.noticeBoardRepository.findOne({
      where: { id: noticeId },
      relations: ['readByUsers', 'users', 'roles']
    });
    
    if (!notice) {
      throw new NotFoundException(`Notice board with ID ${noticeId} not found`);
    }
    
    let totalTargetUsers = 0;
    
    if (notice.sendToAll) {
      // Count all active users if notice is for everyone
      totalTargetUsers = await this.userRepository.count({ 
        where: { status: 'active' } 
      });
    } else {
      // Get users directly assigned to the notice
      const directUsers = notice.users ? notice.users.length : 0;
      
      // Get users who have the roles assigned to this notice
      let roleBasedUsers = 0;
      if (notice.roles && notice.roles.length > 0) {
        const roleIds = notice.roles.map(role => role.id);
        const usersWithRoles = await this.userRepository
          .createQueryBuilder('user')
          .where('user.roleId IN (:...roleIds)', { roleIds })
          .getCount();
        
        roleBasedUsers = usersWithRoles;
      }
      
      // Calculate total target users (removing duplicates)
      // This is an approximation, as we can't easily count unique users without fetching them all
      totalTargetUsers = directUsers + roleBasedUsers;
    }
    
    const totalReadUsers = notice.readByUsers ? notice.readByUsers.length : 0;
    const readPercentage = totalTargetUsers > 0 
      ? Math.round((totalReadUsers / totalTargetUsers) * 100) 
      : 0;
    
    return {
      noticeId,
      title: notice.title,
      totalTargetUsers,
      totalReadUsers,
      readPercentage,
      readByUsers: notice.readByUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email
      }))
    };
  }

  private async sendNoticeBoardEmails(notice: NoticeBoard) {
    try {
      console.log(`Attempting to send emails to ${notice.users.length} users`);
      console.log(`Email sent status before sending: ${notice.emailSent}`);
      
      let allEmailsSuccessful = true;
      
      for (const user of notice.users) {
        console.log(`Sending email to ${user.email} for notice "${notice.title}"`);
        
        try {
          const emailResult = await this.mailService.sendMail(
            {
              to: user.email,
              subject: notice.title,
              slug: 'notice-board-notification', // This matches the actual template in the database
              context: {
                name: user.name,
                noticeTitle: notice.title,
                noticeDescription: notice.description,
                imageUrl: notice.imagePath ? `${process.env.BACKEND_URL || 'http://localhost:7777'}${notice.imagePath}` : null // Add full URL for images
              }
            },
            'notice-board-notification'
          );
          
          console.log(`Email sent result for ${user.email}: ${emailResult}`);
          
          if (!emailResult) {
            allEmailsSuccessful = false;
          }
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
          allEmailsSuccessful = false;
        }
      }

      // Update the emailSent flag
      notice.emailSent = true;
      const savedNotice = await this.noticeBoardRepository.save(notice);
      console.log(`Email sent flag updated for notice ID: ${notice.id}, new value: ${savedNotice.emailSent}`);

      return allEmailsSuccessful;
    } catch (error) {
      console.error('Failed to send notice board emails:', error);
      return false;
    }
  }
}