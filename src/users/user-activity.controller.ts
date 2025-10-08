import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { UserHistoryService } from './services/user-history.service';
import { HistoryActionType } from './entities/user.history.entity';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Public } from 'src/common/decorators/public.decorator';
import { Logger } from '@nestjs/common';

@ApiTags('activity')
@Controller('users/activity')
@ApiBearerAuth()
export class UserActivityController {
  constructor(
    private readonly userHistoryService: UserHistoryService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Get('test')
  testActivityEndpoint() {
    Logger.log('Test activity endpoint called');
    return { success: true, message: 'Activity test endpoint is working' };
  }

  @Public()
  @Post('track')
  async trackUserActivity(@Body() activityData: { userId: string, timestamp: string }) {
    // Log the request but sanitize the output to prevent sensitive data exposure    
    // More robust validation
    if (!activityData?.userId || typeof activityData.userId !== 'string' || activityData.userId.trim() === '') {
      return { 
        success: false, 
        message: 'User ID is required for activity tracking' 
      };
    }
    
    try {
      // Validate timestamp format
      let timestamp: Date;
      try {
        timestamp = activityData.timestamp ? new Date(activityData.timestamp) : new Date();
        
        // Check if timestamp is valid
        if (isNaN(timestamp.getTime())) {
          throw new Error('Invalid timestamp format');
        }
      } catch (dateError) {
        Logger.warn(`Invalid timestamp provided: ${activityData.timestamp}`);
        timestamp = new Date();
      }
      
      
      const result = await this.usersService.updateLastActive(activityData.userId, timestamp);
      
      if (!result.success) {
        return { 
          success: false,
          message: result.message || 'Failed to track activity, but continuing session'
        };
      }
      
      return { 
        success: true, 
        message: 'User activity tracked successfully',
        timestamp: timestamp.toISOString()
      };
    } catch (error) {
      Logger.error(`Failed to track user activity: ${error.message}`, error.stack);
      return { 
        success: false, 
        message: 'Activity tracking encountered an error, but continuing session'
      };
    }
  }

  @UseGuards(JwtTwoFactorGuard)
  @Post('track-authenticated')
  async trackActivity(
    @GetUser() currentUser: UserEntity,
    @Body() body: { userId: string; timestamp: string },
  ) {
    const { userId, timestamp } = body;
    
    // Ensure the user can only track their own activity unless they're an admin
    if (userId !== currentUser.id && currentUser.role.name !== 'Admin') {
      return { success: false, message: "Unauthorized to track other users' activity" };
    }
    
    // Update the lastActiveAt field in the user entity
    await this.usersService.updateLastActive(userId, new Date(timestamp));
    
    // Also record this as a history event (low priority)
    try {
      // Get the user entity objects
      const user = await this.usersService.findOne(userId);
      
      await this.userHistoryService.createHistoryRecord(
        user,
        currentUser, // The current user who reported the activity
        HistoryActionType.OTHER,
        'lastActiveAt',
        null,
        timestamp,
        'User activity detected'
      );
    } catch (error) {
      // Non-critical error, just log it
      console.error('Failed to record user activity history:', error);
    }

    return { success: true, timestamp };
  }
}