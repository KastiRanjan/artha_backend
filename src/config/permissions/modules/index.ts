import { ModulesPayloadInterface } from '../types';
import { userModulePermissions } from './user.module';
import { roleModulePermissions } from './role.module';
import { permissionModulePermissions } from './permission.module';
import { projectsModulePermissions } from './projects.module';
import { projectTypesModulePermissions } from './project-types.module';
import { projectEvaluationModulePermissions } from './project-evaluation.module';
import { tasksModulePermissions } from './tasks.module';
import { taskRankingModulePermissions } from './task-ranking.module';
import { taskSuperModulePermissions } from './task-super.module';
import { taskGroupsModulePermissions } from './task-groups.module';
import { taskTemplateModulePermissions } from './task-template.module';
import { taskTypeModulePermissions } from './task-type.module';
import { todoTaskModulePermissions } from './todo-task.module';
import { worklogModulePermissions } from './worklog.module';
import { attendanceModulePermissions } from './attendance.module';
import { leaveModulePermissions } from './leave.module';
import { leaveTypeModulePermissions } from './leave-type.module';
import { calendarModulePermissions } from './calendar.module';
import { holidayModulePermissions } from './holiday.module';
import { workhourModulePermissions } from './workhour.module';
import { clientModulePermissions } from './client.module';
import { dashboardModulePermissions } from './dashboard.module';
import { noticeBoardModulePermissions } from './notice-board.module';
import { notificationModulePermissions } from './notification.module';
import { settingsModulePermissions } from './settings.module';

export const PermissionModules: ModulesPayloadInterface[] = [
  ...userModulePermissions,
  ...roleModulePermissions,
  ...permissionModulePermissions,
  ...projectsModulePermissions,
  ...projectTypesModulePermissions,
  ...projectEvaluationModulePermissions,
  ...tasksModulePermissions,
  ...taskRankingModulePermissions,
  ...taskSuperModulePermissions,
  ...taskGroupsModulePermissions,
  ...taskTemplateModulePermissions,
  ...taskTypeModulePermissions,
  ...todoTaskModulePermissions,
  ...worklogModulePermissions,
  ...attendanceModulePermissions,
  ...leaveModulePermissions,
  ...leaveTypeModulePermissions,
  ...calendarModulePermissions,
  ...holidayModulePermissions,
  ...workhourModulePermissions,
  ...clientModulePermissions,
  ...dashboardModulePermissions,
  ...noticeBoardModulePermissions,
  ...notificationModulePermissions,
  ...settingsModulePermissions,
];

export {
  userModulePermissions,
  roleModulePermissions,
  permissionModulePermissions,
  projectsModulePermissions,
  projectTypesModulePermissions,
  projectEvaluationModulePermissions,
  tasksModulePermissions,
  taskRankingModulePermissions,
  taskSuperModulePermissions,
  taskGroupsModulePermissions,
  taskTemplateModulePermissions,
  taskTypeModulePermissions,
  todoTaskModulePermissions,
  worklogModulePermissions,
  attendanceModulePermissions,
  leaveModulePermissions,
  leaveTypeModulePermissions,
  calendarModulePermissions,
  holidayModulePermissions,
  workhourModulePermissions,
  clientModulePermissions,
  dashboardModulePermissions,
  noticeBoardModulePermissions,
  notificationModulePermissions,
  settingsModulePermissions,
};
