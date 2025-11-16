import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Not } from 'typeorm';
import { ProjectUserAssignment } from './entities/project-user-assignment.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from './entities/project.entity';

export interface UserAvailability {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  isAvailable: boolean;
  busyUntil: Date | null;
  currentProjects: Array<{
    projectId: string;
    projectName: string;
    assignedDate: Date;
    plannedReleaseDate: Date | null;
    isActive: boolean;
  }>;
}

export interface UserAvailabilityTimeline {
  users: UserAvailability[];
  timeline: Array<{
    date: Date;
    availableUsers: string[];
    busyUsers: Array<{
      userId: string;
      projects: string[];
    }>;
  }>;
}

@Injectable()
export class UserAvailabilityService {
  constructor(
    @InjectRepository(ProjectUserAssignment)
    private assignmentRepository: Repository<ProjectUserAssignment>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>
  ) {}

  /**
   * Get all users with their availability status
   */
  async getUserAvailability(date?: Date): Promise<UserAvailability[]> {
    const checkDate = date || new Date();
    
    // Get all active users with their projects
    const users = await this.userRepository.find({
      relations: ['role', 'projects'],
      where: { status: 'active' }
    });

    const userAvailabilities: UserAvailability[] = [];

    for (const user of users) {
      // Get ALL assignments (both active and inactive) that haven't been released
      const allAssignments = await this.assignmentRepository.find({
        where: {
          userId: user.id,
          releaseDate: IsNull() // Only exclude if formally released
        },
        relations: ['project']
      });

      // Filter only for active projects
      const activeProjectAssignments = allAssignments.filter(
        assignment => assignment.project.status === 'active'
      );

      // For availability calculation, only consider active assignments in projects that count
      const availabilityAssignments = activeProjectAssignments.filter(
        assignment => assignment.isActive && 
        assignment.project.countsForAvailability
      );

      // Determine if user is available (based on active assignments in counting projects)
      const isAvailable = availabilityAssignments.length === 0;
      
      // Calculate busy until date (latest planned release date from availability assignments)
      let busyUntil: Date | null = null;
      if (!isAvailable) {
        const plannedDates = availabilityAssignments
          .map(a => a.plannedReleaseDate)
          .filter(d => d !== null);
        
        if (plannedDates.length > 0) {
          busyUntil = new Date(Math.max(...plannedDates.map(d => d.getTime())));
        }
      }

      // Get project IDs from assignments
      const assignmentProjectIds = activeProjectAssignments.map(a => a.project.id);
      
      // Get ALL projects user is a member of (from project.users relationship)
      const memberProjects = user.projects?.filter(p => p.status === 'active') || [];
      
      // Combine both sources of projects
      const projectMap = new Map();
      
      // Add assignment-based projects first
      activeProjectAssignments.forEach(assignment => {
        const startDateToUse = assignment.startDate || assignment.assignedDate;
        projectMap.set(assignment.project.id, {
          projectId: assignment.project.id,
          projectName: assignment.project.name,
          assignedDate: startDateToUse,
          plannedReleaseDate: assignment.plannedReleaseDate,
          isActive: assignment.isActive
        });
      });
      
      // Add member projects that don't have assignments (show as inactive)
      memberProjects.forEach(project => {
        if (!projectMap.has(project.id)) {
          projectMap.set(project.id, {
            projectId: project.id,
            projectName: project.name,
            assignedDate: project.startingDate, // Use project start date
            plannedReleaseDate: project.endingDate, // Use project end date
            isActive: false // Members without explicit assignment are inactive
          });
        }
      });
      
      const currentProjects = Array.from(projectMap.values());

      userAvailabilities.push({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        role: user.role?.name || 'Unknown',
        isAvailable,
        busyUntil,
        currentProjects
      });
    }

    return userAvailabilities;
  }

  /**
   * Get user availability timeline for a date range
   */
  async getUserAvailabilityTimeline(
    startDate: Date,
    endDate: Date
  ): Promise<UserAvailabilityTimeline> {
    const users = await this.getUserAvailability();
    
    // Generate timeline data
    const timeline = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const availableUsers = [];
      const busyUsers = [];

      for (const user of users) {
        const userAssignments = user.currentProjects.filter(project => {
          // Check if user is assigned on this date
          const assignedDate = new Date(project.assignedDate);
          const releaseDate = project.plannedReleaseDate 
            ? new Date(project.plannedReleaseDate) 
            : new Date(endDate);

          return currentDate >= assignedDate && currentDate <= releaseDate;
        });

        if (userAssignments.length === 0) {
          availableUsers.push(user.userId);
        } else {
          busyUsers.push({
            userId: user.userId,
            projects: userAssignments.map(p => p.projectName)
          });
        }
      }

      timeline.push({
        date: new Date(currentDate),
        availableUsers,
        busyUsers
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      users,
      timeline
    };
  }

  /**
   * Get availability for a specific user
   */
  async getUserAvailabilityById(userId: string): Promise<UserAvailability | null> {
    const availabilities = await this.getUserAvailability();
    return availabilities.find(a => a.userId === userId) || null;
  }

  /**
   * Get all available users at a specific date
   */
  async getAvailableUsers(date?: Date): Promise<UserAvailability[]> {
    const availabilities = await this.getUserAvailability(date);
    return availabilities.filter(a => a.isAvailable);
  }

  /**
   * Get users who will be available by a specific date
   */
  async getUsersAvailableBy(date: Date): Promise<UserAvailability[]> {
    const availabilities = await this.getUserAvailability();
    return availabilities.filter(a => {
      if (a.isAvailable) return true;
      if (!a.busyUntil) return false;
      return new Date(a.busyUntil) <= date;
    });
  }
}
