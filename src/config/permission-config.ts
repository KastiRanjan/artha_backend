// All permissions are now directly defined in this file
// No imports needed for permissions

interface PermissionConfigInterface {
  roles: Array<rolePayload>;
  defaultRoutes?: Array<RoutePayloadInterface>;
  modules: Array<ModulesPayloadInterface>;
  projectmanagerPermission: Array<ModulesPayloadInterface>;
  auditseniorPermission: Array<ModulesPayloadInterface>;
  administratorPermission: Array<ModulesPayloadInterface>;
  auditjuniorPermission: Array<ModulesPayloadInterface>;
}

interface rolePayload {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

export enum MethodList {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete',
  ANY = 'any',
  OPTIONS = 'options'
}

export interface RoutePayloadInterface {
  path: string;
  method: MethodList;
  resource?: string;
  description?: string;
  isDefault?: boolean;
}

export interface ModulesPayloadInterface {
  name: string;
  resource: string;
  hasSubmodules: boolean;
  route?: string;
  submodules?: Array<SubModulePayloadInterface>;
  permissions?: Array<PermissionPayload>;
}

export interface SubModulePayloadInterface {
  name: string;
  resource?: string;
  route?: string;
  permissions?: Array<PermissionPayload>;
}

export interface PermissionPayload {
  name: string;
  resource?: string;
  route: Array<RoutePayloadInterface>;
}

export const PermissionConfiguration: PermissionConfigInterface = {
  roles: [
    {
      id: 'ed34dee5-9aa9-4434-a08f-369d82425a89',
      name: 'projectmanager',
      displayName: 'Project Manager',
      description: ''
    },
    {
      id: '3a8f7d5f-95c4-4a9e-af3e-39f5b72b3f6c',
      name: 'superuser',
      displayName: 'Super User',
      description: ''
    },
    {
      id: '7c9f6f7a-3a6a-46ea-8c1f-64c1e9f2f7f7',
      name: 'administrator',
      displayName: 'Administrator',
      description: ''
    },
    {
      id: 'c781eb6c-f4ec-41ed-861e-17d0ef1afa97',
      name: 'auditsenior',
      displayName: 'Audit Senior',
      description: ''
    },
    {
      id: '4ea78ec9-3cd1-45d1-a8ee-9f373b9315eb',
      name: 'auditjunior',
      displayName: 'Audit Junior',
      description: ''
    }
  ],
  defaultRoutes: [
    {
      path: '/check',
      method: MethodList.GET
    },
    {
      path: '/auth/register',
      method: MethodList.POST
    },
    {
      path: '/auth/login',
      method: MethodList.POST
    },
    {
      path: '/auth/profile',
      method: MethodList.GET
    },
    {
      path: '/auth/activate-account',
      method: MethodList.GET
    },
    {
      path: '/auth/forgot-password',
      method: MethodList.PUT
    },
    {
      path: '/auth/reset-password',
      method: MethodList.PUT
    },
    {
      path: '/auth/change-password',
      method: MethodList.PUT
    },
    {
      path: '/auth/profile',
      method: MethodList.PUT
    },
    {
      path: '/revoke/:id',
      method: MethodList.PUT
    },
    {
      path: '/auth/token-info',
      method: MethodList.GET
    },
    {
      path: '/dashboard/users',
      method: MethodList.GET
    },
    {
      path: '/dashboard/os',
      method: MethodList.GET
    },
    {
      path: '/dashboard/browser',
      method: MethodList.GET
    },
    {
      path: '/logout',
      method: MethodList.POST
    },
    {
      path: '/leave/my-leaves',
      method: MethodList.GET
    },
    {
      path: '/leave/balance/:userId',
      method: MethodList.GET
    },
    {
      path: '/leave/balance/:userId/:leaveType',
      method: MethodList.GET
    },
    {
      path: '/leave/approvals/pending',
      method: MethodList.GET
    },
    {
      path: '/leave/:id/approve',
      method: MethodList.PATCH
    }
  ],
  modules: [
    {
      name: 'Task Super Project Management',
      resource: 'task-super-project',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task super projects',
          route: [
            {
              path: '/task-super-project',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task super project',
          route: [
            {
              path: '/task-super-project',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task super project',
          route: [
            {
              path: '/task-super-project/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task super project by id',
          route: [
            {
              path: '/task-super-project/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task super project by id',
          route: [
            {
              path: '/task-super-project/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Get task super projects by project id',
          route: [
            {
              path: '/task-super-project/project/:projectId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Task Group Project Management',
      resource: 'task-group-project',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task group projects',
          route: [
            {
              path: '/task-group-project',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task group project',
          route: [
            {
              path: '/task-group-project',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task group project',
          route: [
            {
              path: '/task-group-project/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task group project by id',
          route: [
            {
              path: '/task-group-project/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task group project by id',
          route: [
            {
              path: '/task-group-project/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Get task group projects by project id',
          route: [
            {
              path: '/task-group-project/project/:projectId',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task group projects by task super project id',
          route: [
            {
              path: '/task-group-project/task-super-project/:taskSuperProjectId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Task Ranking Management',
      resource: 'task-ranking',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View task rankings',
          route: [
            {
              path: '/tasks/ranking',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update task rankings',
          route: [
            {
              path: '/tasks/ranking',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Task Type Management',
      resource: 'task-type',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all task types',
          route: [
            {
              path: '/task-type',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create task type',
          route: [
            {
              path: '/task-type',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View task type by id',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update task type',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete task type',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Task Super Management',
      resource: 'task-super',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task super',
          route: [
            {
              path: '/task-super',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task super',
          route: [
            {
              path: '/task-super',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task super',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task super by id',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task super by id',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Add task super to project',
          route: [
            {
              path: '/task-super/add-to-project',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update task super rankings',
          route: [
            {
              path: '/task-super/rankings',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    
    {
      name: 'Task Type Management',
      resource: 'task-type',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all task types',
          route: [
            {
              path: '/task-type',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create task type',
          route: [
            {
              path: '/task-type',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View task type by id',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update task type',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete task type',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    
    {
      name: 'User management',
      resource: 'user',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all user',
          route: [
            {
              path: '/users',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Store new user',
          route: [
            {
              path: '/users',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update user by id',
          route: [
            {
              path: '/users/edit/:id',
              method: MethodList.PUT
            },
            {
              path: '/users/edit/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get user by id',
          route: [
            {
              path: '/users/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete user by id',
          route: [
            {
              path: '/users/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Get user profile',
          route: [
            {
              path: '/users/:id/profile',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create user profile',
          route: [
            {
              path: '/users/:id/profile',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update user profile',
          route: [
            {
              path: '/users/:id/profile',
              method: MethodList.PUT
            },
            {
              path: '/users/:id/profile',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get user bank details',
          route: [
            {
              path: '/users/:id/bank-detail',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create user bank details',
          route: [
            {
              path: '/users/:id/bank-detail',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update user bank details',
          route: [
            {
              path: '/users/:id/bank-detail',
              method: MethodList.PUT
            },
            {
              path: '/users/:id/bank-detail',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get user education details',
          route: [
            {
              path: '/users/:id/education-detail',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create user education details',
          route: [
            {
              path: '/users/:id/education-detail',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update user education details',
          route: [
            {
              path: '/users/:id/education-detail',
              method: MethodList.PUT
            },
            {
              path: '/users/:id/education-detail',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get user documents',
          route: [
            {
              path: '/users/:id/document',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Upload user documents',
          route: [
            {
              path: '/users/:id/document',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Delete user document',
          route: [
            {
              path: '/users/:id/document/:documentId',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Update user status',
          route: [
            {
              path: '/users/:id/status',
              method: MethodList.PATCH
            }
          ]
        },
                {
          name: 'Get user history',
          route: [
            {
              path: '/users/:id/history',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
  name: 'Department Management',
  resource: 'department',
  hasSubmodules: false,
  permissions: [
    {
      name: 'View all departments',
      route: [
        {
          path: '/department',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'View department by id',
      route: [
        {
          path: '/department/:id',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'Create department',
      route: [
        {
          path: '/department',
          method: MethodList.POST
        }
      ]
    },
    {
      name: 'Update department',
      route: [
        {
          path: '/department/:id',
          method: MethodList.PATCH
        }
      ]
    },
    {
      name: 'Toggle department active status',
      route: [
        {
          path: '/department/:id/toggle-active',
          method: MethodList.PATCH
        }
      ]
    },
    {
      name: 'Delete department',
      route: [
        {
          path: '/department/:id',
          method: MethodList.DELETE
        }
      ]
    }
  ]
},
    {
      name: 'Role management',
      resource: 'role',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all role',
          route: [
            {
              path: '/roles',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View role by id',
          route: [
            {
              path: '/roles/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Store new role',
          route: [
            {
              path: '/roles',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update role by id',
          route: [
            {
              path: '/roles/:id',
              method: MethodList.PUT
            }
          ]
        },
        {
          name: 'Update role permissions',
          route: [
            {
              path: '/roles/:id/permissions',
              method: MethodList.PUT
            }
          ]
        },
        {
          name: 'Delete role by id',
          route: [
            {
              path: '/roles/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Permission management',
      resource: 'permission',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all permission',
          route: [
            {
              path: '/permissions',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Sync permission from config',
          route: [
            {
              path: '/permissions/sync',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View permission by id',
          route: [
            {
              path: '/permissions/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Store new permission',
          route: [
            {
              path: '/permissions',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update permission by id',
          route: [
            {
              path: '/permissions/:id',
              method: MethodList.PUT
            }
          ]
        },
        {
          name: 'Delete permission by id',
          route: [
            {
              path: '/permissions/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Email Templates',
      resource: 'emailTemplates',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all email templates',
          route: [
            {
              path: '/email-templates',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View email templates by id',
          route: [
            {
              path: '/email-templates/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Store new email templates',
          route: [
            {
              path: '/email-templates',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update email templates by id',
          route: [
            {
              path: '/email-templates/:id',
              method: MethodList.PUT
            }
          ]
        },
        {
          name: 'Delete email templates by id',
          route: [
            {
              path: '/email-templates/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Project Management',
      resource: 'projects',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all Projects',
          route: [
            {
              path: '/projects',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View project by id',
          route: [
            {
              path: '/projects/:id',
              method: MethodList.GET
            },
            {
              path: '/projects/:id/timeline',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View user projects',
          route: [
            {
              path: '/projects/users/:uid',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Store new project',
          route: [
            {
              path: '/projects',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update project by id',
          route: [
            {
              path: '/projects/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete project by id',
          route: [
            {
              path: '/projects/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Add tasks from templates',
          route: [
            {
              path: '/projects/add-from-templates',
              method: MethodList.POST
            }
          ]
        }
      ]
    },
    {
      name: 'Project Types',
      resource: 'nature-of-work',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all Project Types',
          route: [
            { path: '/nature-of-work', method: MethodList.GET }
          ]
        },
        {
          name: 'View Project Type by id',
          route: [
            { path: '/nature-of-work/:id', method: MethodList.GET }
          ]
        },
        {
          name: 'Create Project Type',
          route: [
            { path: '/nature-of-work', method: MethodList.POST }
          ]
        },
        {
          name: 'Update Project Type',
          route: [
            { path: '/nature-of-work/:id', method: MethodList.PATCH }
          ]
        },
        {
          name: 'Delete Project Type',
          route: [
            { path: '/nature-of-work/:id', method: MethodList.DELETE }
          ]
        }
      ]
    },
    {
      name: 'Task Management',
      resource: 'tasks',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all tasks',
          route: [
            { path: '/tasks', method: MethodList.GET }
          ]
        },
        {
          name: 'Add task',
          route: [
            { path: '/tasks', method: MethodList.POST }
          ]
        },
        {
          name: 'Add tasks in bulk',
          route: [
            { path: '/tasks/add-bulk', method: MethodList.POST },
            { path: '/tasks/add-bulk-list', method: MethodList.POST }
          ]
        },
        {
          name: 'Get task by id',
          route: [
            { path: '/tasks/:id', method: MethodList.GET }
          ]
        },
        {
          name: 'Get tasks by project id',
          route: [
            { path: '/tasks/project/:id', method: MethodList.GET },
            { path: '/tasks/:tid/project/:pid', method: MethodList.GET }
          ]
        },
        {
          name: 'Get tasks by project and user',
          route: [
            { path: '/tasks/project/:pid/user/:uid', method: MethodList.GET }
          ]
        },
        {
          name: 'Update task by id',
          route: [
            { path: '/tasks/:id', method: MethodList.PATCH }
          ]
        },
        {
          name: 'Bulk update tasks',
          route: [
            { path: '/tasks/bulk-update', method: MethodList.PATCH }
          ]
        },
        {
          name: 'Delete task by id',
          route: [
            { path: '/tasks/:id', method: MethodList.DELETE }
          ]
        },
        {
          name: 'Mark tasks complete',
          route: [
            { path: '/tasks/mark-complete', method: MethodList.PATCH }
          ]
        },
        {
          name: 'first-verify-task',
          route: [
            { path: '/tasks/first-verify', method: MethodList.PATCH }
          ]
        },
        {
          name: 'second-verify-task',
          route: [
            { path: '/tasks/second-verify', method: MethodList.PATCH }
          ]
        }
      ]
    },
    {
      name: 'Notification Management',
      resource: 'notification',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Create notification',
          route: [
            { path: '/notification', method: MethodList.POST }
          ]
        },
        {
          name: 'View all notifications',
          route: [
            { path: '/notification', method: MethodList.GET }
          ]
        },
        {
          name: 'View notification by id',
          route: [
            { path: '/notification/:id', method: MethodList.GET }
          ]
        },
        {
          name: 'Update notification by id',
          route: [
            { path: '/notification/:id', method: MethodList.PATCH }
          ]
        },
        {
          name: 'Delete notification by id',
          route: [
            { path: '/notification/:id', method: MethodList.DELETE }
          ]
        }
      ]
    },
    {
      name: 'Dashboard',
      resource: 'dashboard',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get user stats',
          route: [
            { path: '/dashboard/users', method: MethodList.GET }
          ]
        },
        {
          name: 'Get os stats',
          route: [
            { path: '/dashboard/os', method: MethodList.GET }
          ]
        },
        {
          name: 'Get browser stats',
          route: [
            { path: '/dashboard/browser', method: MethodList.GET }
          ]
        },        
        {
          name: 'View Dashboard Attendance',
          route: [
            {
              path: '/dashboard/attendance',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View Dashboard Working Time',
          route: [
            {
              path: '/dashboard/working-time',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Task Template Management',
      resource: 'task-template',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task template',
          route: [
            {
              path: '/task-template',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Edit task template',
          route: [
            {
              path: '/task-template/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Add task template',
          route: [
            {
              path: '/task-template',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Get task template',
          route: [
            {
              path: '/task-template/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task template',
          route: [
            {
              path: '/task-template/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Task Group Management',
      resource: 'task-group',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task group',
          route: [
            {
              path: '/task-group',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task group',
          route: [
            {
              path: '/task-group',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task group',
          route: [
            {
              path: '/task-group/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task group by id',
          route: [
            {
              path: '/task-group/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task group by id',
          route: [
            {
              path: '/task-group/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Worklog Management',
      resource: 'worklogs',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all worklogs',
          route: [
            { path: '/worklogs', method: MethodList.GET }
          ]
        },
        {
          name: 'Get worklog by id',
          route: [
            { path: '/worklogs/:id', method: MethodList.GET }
          ]
        },
        {
          name: 'Get worklogs by task',
          route: [
            { path: '/worklogs/task/:id', method: MethodList.GET }
          ]
        },
        {
          name: 'Get worklogs by user',
          route: [
            { path: '/worklogs/user', method: MethodList.GET }
          ]
        },
        {
          name: 'Add worklog',
          route: [
            { path: '/worklogs', method: MethodList.POST }
          ]
        },
        {
          name: 'Edit worklog',
          route: [
            { path: '/worklogs/:id', method: MethodList.PATCH }
          ]
        },
          {
            name: 'Edit worklog date',
            route: [
              { path: '/worklogs/:id/date', method: MethodList.PATCH }
            ]
          },
        {
          name: 'Delete worklog',
          route: [
            { path: '/worklogs/:id', method: MethodList.DELETE }
          ]
        },
        {
          name: 'Get worklogs by user and date',
          route: [
            { path: '/worklogs/user/:userId/date/:date', method: MethodList.GET }
          ]
        },
        {
          name: 'Get all users worklogs by date',
          route: [
            { path: '/worklogs/date/:date/all-users', method: MethodList.GET }
          ]
        },
        {
  name: 'Get all worklogs (admin view)',
  route: [
    {
      path: '/worklogs/allworklog',
      method: MethodList.GET
    }
  ]
}
      ]
    },
    {
      name: 'Attandence Management',
      resource: 'attendance',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all AllAttendance',
          route: [
            {
              path: '/attendance',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add Attendance',
          route: [
            {
              path: '/attendance',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Get Today Attendance',
          route: [
            {
              path: '/attendance/today-attendence',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get Attendance by ID',
          route: [
            {
              path: '/attendance/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Edit Attendance',
          route: [
            {
              path: '/attendance/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete Attendance by ID',
          route: [
            {
              path: '/attendance/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Get Attendance by User ID',
          route: [
            {
              path: '/attendance/user/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View All Users Attendance',
          route: [
            {
              path: '/attendance/all-users',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View Today All Users Attendance',
          route: [
            {
              path: '/attendance/today-all-users',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View Date-wise All Users Attendance',
          route: [
            {
              path: '/attendance/date-wise-all-users',
              method: MethodList.GET
            }
          ]
        },
      ]
    },
    {
      name: 'Client Management',
      resource: 'client',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all Client',
          route: [
            {
              path: '/clients',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get Single Client',
          route: [
            {
              path: '/clients/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add Client',
          route: [
            {
              path: '/clients',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit Client',
          route: [
            {
              path: '/clients/:id',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Client Portal Credentials Management',
      resource: 'client-portal-credentials',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View client portal credentials',
          route: [
            {
              path: '/clients/:customerId/portal-credentials',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View client portal credential by id',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
  name: 'Billing Management',
  resource: 'billing',
  hasSubmodules: false,
  permissions: [
    {
      name: 'View all billings',
      route: [
        {
          path: '/billing',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'View billing by id',
      route: [
        {
          path: '/billing/:id',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'Store new billing',
      route: [
        {
          path: '/billing',
          method: MethodList.POST
        }
      ]
    },
    {
      name: 'Update billing by id',
      route: [
        {
          path: '/billing/:id',
          method: MethodList.PATCH
        }
      ]
    },
    {
      name: 'Delete billing by id',
      route: [
        {
          path: '/billing/:id',
          method: MethodList.DELETE
        }
      ]
    }
  ]
},
    {
      name: 'Holiday Management',
      resource: 'holiday',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all holidays',
          route: [
            {
              path: '/holiday',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add holiday',
          route: [
            {
              path: '/holiday',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View holiday by id',
          route: [
            {
              path: '/holiday/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update holiday',
          route: [
            {
              path: '/holiday/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete holiday',
          route: [
            {
              path: '/holiday/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Import holidays CSV',
          route: [
            {
              path: '/holiday/import-csv',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Preview holidays CSV',
          route: [
            {
              path: '/holiday/preview-csv',
              method: MethodList.POST
            }
          ]
        }
      ]
    },
    {
      name: 'Leave Management',
      resource: 'leave',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all leaves',
          route: [
            {
              path: '/leave',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Apply for leave',
          route: [
            {
              path: '/leave',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View leave by id',
          route: [
            {
              path: '/leave/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update leave',
          route: [
            {
              path: '/leave/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete leave',
          route: [
            {
              path: '/leave/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Approve leave (any)',
          route: [
            {
              path: '/leave/:id/approve',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Approve leave by lead',
          route: [
            {
              path: '/leave/:id/approve/lead',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Approve leave by PM',
          route: [
            {
              path: '/leave/:id/approve/pm',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Approve leave by admin',
          route: [
            {
              path: '/leave/:id/approve/admin',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Reject leave',
          route: [
            {
              path: '/leave/:id/reject',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Leave calendar view',
          route: [
            {
              path: '/leave/calendar/view',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View user leaves',
          route: [
            {
              path: '/leave/user/:userId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Work Hour Management',
      resource: 'workhour',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all work hours',
          route: [
            {
              path: '/workhour',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create work hour config',
          route: [
            {
              path: '/workhour',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View work hour by id',
          route: [
            {
              path: '/workhour/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update work hour config',
          route: [
            {
              path: '/workhour/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete work hour config',
          route: [
            {
              path: '/workhour/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Resolve work hours for user',
          route: [
            {
              path: '/workhour/resolve/:userId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Calendar Management',
      resource: 'calendar',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all calendar events',
          route: [
            {
              path: '/calendar',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create calendar event',
          route: [
            {
              path: '/calendar',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View calendar event by id',
          route: [
            {
              path: '/calendar/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update calendar event',
          route: [
            {
              path: '/calendar/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete calendar event',
          route: [
            {
              path: '/calendar/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'AD to BS conversion',
          route: [
            {
              path: '/calendar/convert/ad-to-bs',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'BS to AD conversion',
          route: [
            {
              path: '/calendar/convert/bs-to-ad',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Calendar month view',
          route: [
            {
              path: '/calendar/month',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Leave Type Management',
      resource: 'leave-type',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all leave types',
          route: [
            {
              path: '/leave-type',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View active leave types',
          route: [
            {
              path: '/leave-type/active',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create leave type',
          route: [
            {
              path: '/leave-type',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View leave type by id',
          route: [
            {
              path: '/leave-type/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update leave type',
          route: [
            {
              path: '/leave-type/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete leave type',
          route: [
            {
              path: '/leave-type/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Toggle leave type status',
          route: [
            {
              path: '/leave-type/:id/toggle-status',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Business Size Management',
      resource: 'business-size',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all business sizes',
          route: [
            {
              path: '/business-size',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create business size',
          route: [
            {
              path: '/business-size',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View business size by id',
          route: [
            {
              path: '/business-size/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update business size',
          route: [
            {
              path: '/business-size/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete business size',
          route: [
            {
              path: '/business-size/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Business Nature Management',
      resource: 'business-nature',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all business natures',
          route: [
            {
              path: '/business-nature',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create business nature',
          route: [
            {
              path: '/business-nature',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View business nature by id',
          route: [
            {
              path: '/business-nature/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update business nature',
          route: [
            {
              path: '/business-nature/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete business nature',
          route: [
            {
              path: '/business-nature/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    // Legal Status Management
    {
      name: 'Legal Status Management',
      resource: 'legal-status',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all legal statuses',
          route: [
            {
              path: '/legal-status',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create legal status',
          route: [
            {
              path: '/legal-status',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View legal status by id',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update legal status',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete legal status',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    // Notice Board Management
    {
      name: 'Notice Board Management',
      resource: 'notice-board',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all notices',
          route: [
            {
              path: '/notice-board',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View my notices',
          route: [
            {
              path: '/notice-board/my-notices',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create notice',
          route: [
            {
              path: '/notice-board',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Upload notice image',
          route: [
            {
              path: '/notice-board/upload-image',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View notice by id',
          route: [
            {
              path: '/notice-board/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get notice read statistics',
          route: [
            {
              path: '/notice-board/:id/statistics',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update notice',
          route: [
            {
              path: '/notice-board/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Mark notice as read',
          route: [
            {
              path: '/notice-board/:id/mark-as-read',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete notice',
          route: [
            {
              path: '/notice-board/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    // Portal Credentials Management
    {
      name: 'Portal Credentials Management',
      resource: 'portal-credentials',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all portal credentials',
          route: [
            {
              path: '/portal-credentials',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View portal credentials by id',
          route: [
            {
              path: '/portal-credentials/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View portal credentials by customer',
          route: [
            {
              path: '/portal-credentials/customer/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create portal credentials',
          route: [
            {
              path: '/portal-credentials',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update portal credentials',
          route: [
            {
              path: '/portal-credentials/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete portal credentials',
          route: [
            {
              path: '/portal-credentials/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    // Client Portal Credentials Management
    {
      name: 'Client Portal Credentials Management',
      resource: 'client-portal-credentials',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View client portal credentials',
          route: [
            {
              path: '/clients/:customerId/portal-credentials',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View client portal credential by id',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    // Todo Task Management
    {
      name: 'Todo Task Management',
      resource: 'todo-task',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all todo tasks',
          route: [
            {
              path: '/todo-task',
              method: MethodList.GET,
              resource: 'todo-task',
              description: 'View all todo tasks'
            }
          ]
        },
        {
          name: 'View todo tasks by status',
          route: [
            {
              path: '/todo-task/status/:status',
              method: MethodList.GET,
              resource: 'todo-task',
              description: 'View todo tasks by status'
            }
          ]
        },
        {
          name: 'View todo tasks assigned to user',
          route: [
            {
              path: '/todo-task/assigned/:userId',
              method: MethodList.GET,
              resource: 'todo-task',
              description: 'View todo tasks assigned to a specific user'
            }
          ]
        },
        {
          name: 'View todo tasks created by user',
          route: [
            {
              path: '/todo-task/created/:userId',
              method: MethodList.GET,
              resource: 'todo-task',
              description: 'View todo tasks created by a specific user'
            }
          ]
        },
        {
          name: 'View todo task by id',
          route: [
            {
              path: '/todo-task/:id',
              method: MethodList.GET,
              resource: 'todo-task',
              description: 'View a specific todo task by ID'
            }
          ]
        },
        {
          name: 'Create todo task',
          route: [
            {
              path: '/todo-task',
              method: MethodList.POST,
              resource: 'todo-task',
              description: 'Create a new todo task'
            }
          ]
        },
        {
          name: 'Update todo task',
          route: [
            {
              path: '/todo-task/:id',
              method: MethodList.PATCH,
              resource: 'todo-task',
              description: 'Update a todo task'
            }
          ]
        },
        {
          name: 'Acknowledge todo task',
          route: [
            {
              path: '/todo-task/:id/acknowledge',
              method: MethodList.PATCH,
              resource: 'todo-task',
              description: 'Acknowledge a todo task'
            }
          ]
        },
        {
          name: 'Mark todo task as pending',
          route: [
            {
              path: '/todo-task/:id/pending',
              method: MethodList.PATCH,
              resource: 'todo-task',
              description: 'Mark a todo task as pending'
            }
          ]
        },
        {
          name: 'Complete todo task',
          route: [
            {
              path: '/todo-task/:id/complete',
              method: MethodList.PATCH,
              resource: 'todo-task',
              description: 'Complete a todo task'
            }
          ]
        },
        {
          name: 'Drop todo task',
          route: [
            {
              path: '/todo-task/:id/drop',
              method: MethodList.PATCH,
              resource: 'todo-task',
              description: 'Drop a todo task'
            }
          ]
        },
        {
          name: 'Delete todo task',
          route: [
            {
              path: '/todo-task/:id',
              method: MethodList.DELETE,
              resource: 'todo-task',
              description: 'Delete a todo task'
            }
          ]
        },
        {
          name: 'View all todo tasks',
          route: [
            {
              path: '/todo-task',
              method: MethodList.GET,
              resource: 'todo-task',
              description: 'View all todo tasks',
              isDefault: false
            }
          ]
        }
      ]
    }

  ],
  projectmanagerPermission: [
    {
      name: 'Task Super Project Management',
      resource: 'task-super-project',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task super projects',
          route: [
            {
              path: '/task-super-project',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task super project',
          route: [
            {
              path: '/task-super-project',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task super project',
          route: [
            {
              path: '/task-super-project/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task super project by id',
          route: [
            {
              path: '/task-super-project/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task super project by id',
          route: [
            {
              path: '/task-super-project/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Get task super projects by project id',
          route: [
            {
              path: '/task-super-project/project/:projectId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Task Group Project Management',
      resource: 'task-group-project',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task group projects',
          route: [
            {
              path: '/task-group-project',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task group project',
          route: [
            {
              path: '/task-group-project',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task group project',
          route: [
            {
              path: '/task-group-project/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task group project by id',
          route: [
            {
              path: '/task-group-project/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task group project by id',
          route: [
            {
              path: '/task-group-project/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Get task group projects by project id',
          route: [
            {
              path: '/task-group-project/project/:projectId',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task group projects by task super project id',
          route: [
            {
              path: '/task-group-project/task-super-project/:taskSuperProjectId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Task Ranking Management',
      resource: 'task-ranking',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View task rankings',
          route: [
            {
              path: '/tasks/ranking',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update task rankings',
          route: [
            {
              path: '/tasks/ranking',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Task Super Management',
      resource: 'task-super',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task super',
          route: [
            {
              path: '/task-super',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task super',
          route: [
            {
              path: '/task-super',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task super',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task super by id',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task super by id',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'User management',
      resource: 'user',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all user',
          route: [
            {
              path: '/users',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user by id',
          route: [
            {
              path: '/users/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user profile',
          route: [
            {
              path: '/users/:id/profile',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user bank details',
          route: [
            {
              path: '/users/:id/bank-detail',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user education details',
          route: [
            {
              path: '/users/:id/education-detail',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user documents',
          route: [
            {
              path: '/users/:id/document',
              method: MethodList.GET
            }
          ]
        }
      ]
    },

    {
      name: 'Project Management',
      resource: 'projects',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all Projects',
          route: [
            {
              path: '/projects',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View project by id',
          route: [
            {
              path: '/projects/:id',
              method: MethodList.GET
            },
            {
              path: '/projects/:id/timeline',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Store new project',
          route: [
            {
              path: '/projects',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update project by id',
          route: [
            {
              path: '/projects/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete project by id',
          route: [
            {
              path: '/projects/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Task Management',
      resource: 'tasks',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all taskGroup',
          route: [
            {
              path: '/tasks',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task to project',
          route: [
            {
              path: '/tasks',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task o project',
          route: [
            {
              path: '/tasks/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get Project task',
          route: [
            {
              path: '/tasks/project/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task to project bulk',
          route: [
            {
              path: '/tasks/add-bulk',
              method: MethodList.POST
            }
          ]
        }
      ]
    },
    {
      name: 'Task Template Management',
      resource: 'task-template',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task template',
          route: [
            {
              path: '/task-template',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Edit task template',
          route: [
            {
              path: '/task-template/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Add task template',
          route: [
            {
              path: '/task-template',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Get task template',
          route: [
            {
              path: '/task-template/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task template',
          route: [
            {
              path: '/task-template/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Task Group Management',
      resource: 'task-group',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task group',
          route: [
            {
              path: '/task-group',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task group',
          route: [
            {
              path: '/task-group',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task group',
          route: [
            {
              path: '/task-group/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task group by id',
          route: [
            {
              path: '/task-group/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task group by id',
          route: [
            {
              path: '/task-group/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Worklog Management',
      resource: 'worklogs',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all workloglist',
          route: [
            {
              path: '/worklogs',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get My workloglist',
          route: [
            {
              path: '/worklogs/:uid',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add Worklog',
          route: [
            {
              path: '/worklogs',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit Worklog',
          route: [
            {
              path: '/worklogs/:id',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Attandence Management',
      resource: 'attendance',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all AllAttendance',
          route: [
            {
              path: '/attendance',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add Attendance',
          route: [
            {
              path: '/attendance',
              method: MethodList.POST
            }
          ]
        },
            {
      name: 'Get Attendance by ID',
      route: [
        {
          path: '/attendance/:id',
          method: MethodList.GET
        }
      ]
    },
        {
          name: 'Edit Attendance',
          route: [
            {
              path: '/attendance/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
      name: 'Delete Attendance by ID',
      route: [
        {
          path: '/attendance/:id',
          method: MethodList.DELETE
        }
      ]
    },
    {
      name: 'Get Attendance by User ID',
      route: [
        {
          path: '/attendance/user/:id',
          method: MethodList.GET
        }
      ]
    }
      ]
    },
    {
      name: 'Holiday Management',
      resource: 'holiday',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all holidays',
          route: [
            {
              path: '/holiday',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add holiday',
          route: [
            {
              path: '/holiday',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View holiday by id',
          route: [
            {
              path: '/holiday/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update holiday',
          route: [
            {
              path: '/holiday/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete holiday',
          route: [
            {
              path: '/holiday/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Import holidays CSV',
          route: [
            {
              path: '/holiday/import-csv',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Preview holidays CSV',
          route: [
            {
              path: '/holiday/preview-csv',
              method: MethodList.POST
            }
          ]
        }
      ]
    },
    {
      name: 'Leave Management',
      resource: 'leave',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all leaves',
          route: [
            {
              path: '/leave',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Apply for leave',
          route: [
            {
              path: '/leave',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View leave by id',
          route: [
            {
              path: '/leave/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update leave',
          route: [
            {
              path: '/leave/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete leave',
          route: [
            {
              path: '/leave/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Approve leave by lead',
          route: [
            {
              path: '/leave/:id/approve/lead',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Approve leave by PM',
          route: [
            {
              path: '/leave/:id/approve/pm',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Approve leave by admin',
          route: [
            {
              path: '/leave/:id/approve/admin',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Reject leave',
          route: [
            {
              path: '/leave/:id/reject',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Leave calendar view',
          route: [
            {
              path: '/leave/calendar/view',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View user leaves',
          route: [
            {
              path: '/leave/user/:userId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Work Hour Management',
      resource: 'workhour',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all work hours',
          route: [
            {
              path: '/workhour',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create work hour config',
          route: [
            {
              path: '/workhour',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View work hour by id',
          route: [
            {
              path: '/workhour/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update work hour config',
          route: [
            {
              path: '/workhour/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete work hour config',
          route: [
            {
              path: '/workhour/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Resolve work hours for user',
          route: [
            {
              path: '/workhour/resolve/:userId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Calendar Management',
      resource: 'calendar',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all calendar events',
          route: [
            {
              path: '/calendar',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create calendar event',
          route: [
            {
              path: '/calendar',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View calendar event by id',
          route: [
            {
              path: '/calendar/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update calendar event',
          route: [
            {
              path: '/calendar/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete calendar event',
          route: [
            {
              path: '/calendar/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'AD to BS conversion',
          route: [
            {
              path: '/calendar/convert/ad-to-bs',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'BS to AD conversion',
          route: [
            {
              path: '/calendar/convert/bs-to-ad',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Calendar month view',
          route: [
            {
              path: '/calendar/month',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Leave Type Management',
      resource: 'leave-type',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all leave types',
          route: [
            {
              path: '/leave-type',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View active leave types',
          route: [
            {
              path: '/leave-type/active',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create leave type',
          route: [
            {
              path: '/leave-type',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View leave type by id',
          route: [
            {
              path: '/leave-type/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update leave type',
          route: [
            {
              path: '/leave-type/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete leave type',
          route: [
            {
              path: '/leave-type/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Toggle leave type status',
          route: [
            {
              path: '/leave-type/:id/toggle-status',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Legal Status Management',
      resource: 'legal-status',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all legal statuses',
          route: [
            {
              path: '/legal-status',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create legal status',
          route: [
            {
              path: '/legal-status',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View legal status by id',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update legal status',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete legal status',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Client Management',
      resource: 'client',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all Client',
          route: [
            {
              path: '/clients',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get Single Client',
          route: [
            {
              path: '/clients/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add Client',
          route: [
            {
              path: '/clients',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit Client',
          route: [
            {
              path: '/clients/:id',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Client Portal Credentials Management',
      resource: 'client-portal-credentials',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View client portal credentials',
          route: [
            {
              path: '/clients/:customerId/portal-credentials',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View client portal credential by id',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    // Task Type Management for Project Manager
    {
      name: 'Task Type Management',
      resource: 'task-type',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all task types',
          route: [
            {
              path: '/task-type',
              method: MethodList.GET,
              resource: 'task-type',
              description: 'View all task types'
            }
          ]
        },
        {
          name: 'View task type by id',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.GET,
              resource: 'task-type',
              description: 'View task type by id'
            }
          ]
        },
        {
          name: 'Create task type',
          route: [
            {
              path: '/task-type',
              method: MethodList.POST,
              resource: 'task-type',
              description: 'Create a new task type'
            }
          ]
        },
        {
          name: 'Update task type',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.PATCH,
              resource: 'task-type',
              description: 'Update a task type'
            }
          ]
        },
        {
          name: 'Delete task type',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.DELETE,
              resource: 'task-type',
              description: 'Delete a task type'
            }
          ]
        }
      ]
    },
    // Todo Task Management for Project Manager
    {
      name: 'Todo Task Management',
      resource: 'todo-task',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all todo tasks',
          route: [
            {
              path: '/todo-task',
              method: MethodList.GET,
              resource: 'todo-task',
              description: 'View all todo tasks'
            }
          ]
        },
        {
          name: 'View todo tasks by status',
          route: [
            {
              path: '/todo-task/status/:status',
              method: MethodList.GET,
              resource: 'todo-task',
              description: 'View todo tasks by status'
            }
          ]
        },
        {
          name: 'View todo tasks assigned to user',
          route: [
            {
              path: '/todo-task/assigned/:userId',
              method: MethodList.GET,
              resource: 'todo-task',
              description: 'View todo tasks assigned to a specific user'
            }
          ]
        },
        {
          name: 'View todo tasks created by user',
          route: [
            {
              path: '/todo-task/created/:userId',
              method: MethodList.GET,
              resource: 'todo-task',
              description: 'View todo tasks created by a specific user'
            }
          ]
        },
        {
          name: 'View todo task by id',
          route: [
            {
              path: '/todo-task/:id',
              method: MethodList.GET,
              resource: 'todo-task',
              description: 'View a specific todo task by ID'
            }
          ]
        },
        {
          name: 'Create todo task',
          route: [
            {
              path: '/todo-task',
              method: MethodList.POST,
              resource: 'todo-task',
              description: 'Create a new todo task'
            }
          ]
        },
        {
          name: 'Update todo task',
          route: [
            {
              path: '/todo-task/:id',
              method: MethodList.PATCH,
              resource: 'todo-task',
              description: 'Update a todo task'
            }
          ]
        },
        {
          name: 'Acknowledge todo task',
          route: [
            {
              path: '/todo-task/:id/acknowledge',
              method: MethodList.PATCH,
              resource: 'todo-task',
              description: 'Acknowledge a todo task'
            }
          ]
        },
        {
          name: 'Mark todo task as pending',
          route: [
            {
              path: '/todo-task/:id/pending',
              method: MethodList.PATCH,
              resource: 'todo-task',
              description: 'Mark a todo task as pending'
            }
          ]
        },
        {
          name: 'Complete todo task',
          route: [
            {
              path: '/todo-task/:id/complete',
              method: MethodList.PATCH,
              resource: 'todo-task',
              description: 'Complete a todo task'
            }
          ]
        },
        {
          name: 'Drop todo task',
          route: [
            {
              path: '/todo-task/:id/drop',
              method: MethodList.PATCH,
              resource: 'todo-task',
              description: 'Drop a todo task'
            }
          ]
        },
        {
          name: 'Delete todo task',
          route: [
            {
              path: '/todo-task/:id',
              method: MethodList.DELETE,
              resource: 'todo-task',
              description: 'Delete a todo task'
            }
          ]
        }
      ]
    }
  ],
  auditseniorPermission: [
    {
      name: 'Task Super Project Management',
      resource: 'task-super-project',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task super projects',
          route: [
            {
              path: '/task-super-project',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task super project by id',
          route: [
            {
              path: '/task-super-project/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task super projects by project id',
          route: [
            {
              path: '/task-super-project/project/:projectId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Task Group Project Management',
      resource: 'task-group-project',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task group projects',
          route: [
            {
              path: '/task-group-project',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task group project by id',
          route: [
            {
              path: '/task-group-project/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task group projects by project id',
          route: [
            {
              path: '/task-group-project/project/:projectId',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task group projects by task super project id',
          route: [
            {
              path: '/task-group-project/task-super-project/:taskSuperProjectId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Task Ranking Management',
      resource: 'task-ranking',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View task rankings',
          route: [
            {
              path: '/tasks/ranking',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update task rankings',
          route: [
            {
              path: '/tasks/ranking',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Task Super Management',
      resource: 'task-super',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task super',
          route: [
            {
              path: '/task-super',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task super',
          route: [
            {
              path: '/task-super',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task super',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task super by id',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task super by id',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'User management',
      resource: 'user',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all user',
          route: [
            {
              path: '/users',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user by id',
          route: [
            {
              path: '/users/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user profile',
          route: [
            {
              path: '/users/:id/profile',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user bank details',
          route: [
            {
              path: '/users/:id/bank-detail',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user education details',
          route: [
            {
              path: '/users/:id/education-detail',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user documents',
          route: [
            {
              path: '/users/:id/document',
              method: MethodList.GET
            }
          ]
        }
      ]
    },

    {
      name: 'Project Management',
      resource: 'projects',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all Projects',
          route: [
            {
              path: '/projects',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View project by id',
          route: [
            {
              path: '/projects/:id',
              method: MethodList.GET
            },
            {
              path: '/projects/:id/timeline',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Task Management',
      resource: 'tasks',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all taskGroup',
          route: [
            {
              path: '/tasks',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get Project task',
          route: [
            {
              path: '/tasks/project/:id',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Legal Status Management',
      resource: 'legal-status',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all legal statuses',
          route: [
            {
              path: '/legal-status',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create legal status',
          route: [
            {
              path: '/legal-status',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View legal status by id',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update legal status',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete legal status',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    }
  ],
  administratorPermission: [
    {
      name: 'Task Ranking Management',
      resource: 'task-ranking',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View task rankings',
          route: [
            {
              path: '/tasks/ranking',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update task rankings',
          route: [
            {
              path: '/tasks/ranking',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Task Super Management',
      resource: 'task-super',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task super',
          route: [
            {
              path: '/task-super',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task super',
          route: [
            {
              path: '/task-super',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task super',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task super by id',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task super by id',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'User management',
      resource: 'user',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all user',
          route: [
            {
              path: '/users',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Store new user',
          route: [
            {
              path: '/users',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update user by id',
          route: [
            {
              path: '/users/:id',
              method: MethodList.PUT
            },
            {
              path: '/users/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get user by id',
          route: [
            {
              path: '/users/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete user by id',
          route: [
            {
              path: '/users/:id',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Get user profile',
          route: [
            {
              path: '/users/:id/profile',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create user profile',
          route: [
            {
              path: '/users/:id/profile',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update user profile',
          route: [
            {
              path: '/users/:id/profile',
              method: MethodList.PUT
            },
            {
              path: '/users/:id/profile',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get user bank details',
          route: [
            {
              path: '/users/:id/bank-detail',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create user bank details',
          route: [
            {
              path: '/users/:id/bank-detail',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update user bank details',
          route: [
            {
              path: '/users/:id/bank-detail',
              method: MethodList.PUT
            },
            {
              path: '/users/:id/bank-detail',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get user education details',
          route: [
            {
              path: '/users/:id/education-detail',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create user education details',
          route: [
            {
              path: '/users/:id/education-detail',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update user education details',
          route: [
            {
              path: '/users/:id/education-detail',
              method: MethodList.PUT
            },
            {
              path: '/users/:id/education-detail',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get user documents',
          route: [
            {
              path: '/users/:id/document',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Upload user documents',
          route: [
            {
              path: '/users/:id/document',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Delete user document',
          route: [
            {
              path: '/users/:id/document/:documentId',
              method: MethodList.DELETE
            }
          ]
        },
        {
          name: 'Update user status',
          route: [
            {
              path: '/users/:id/status',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Role management',
      resource: 'role',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all role',
          route: [
            {
              path: '/roles',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View role by id',
          route: [
            {
              path: '/roles/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Store new role',
          route: [
            {
              path: '/roles',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update role by id',
          route: [
            {
              path: '/roles/:id',
              method: MethodList.PUT
            }
          ]
        },
        {
          name: 'Delete role by id',
          route: [
            {
              path: '/roles/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Permission management',
      resource: 'permission',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all permission',
          route: [
            {
              path: '/permissions',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Sync permission from config',
          route: [
            {
              path: '/permissions/sync',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View permission by id',
          route: [
            {
              path: '/permissions/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Store new permission',
          route: [
            {
              path: '/permissions',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update permission by id',
          route: [
            {
              path: '/permissions/:id',
              method: MethodList.PUT
            }
          ]
        },
        {
          name: 'Delete permission by id',
          route: [
            {
              path: '/permissions/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Email Templates',
      resource: 'emailTemplates',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all email templates',
          route: [
            {
              path: '/email-templates',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View email templates by id',
          route: [
            {
              path: '/email-templates/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Store new email templates',
          route: [
            {
              path: '/email-templates',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update email templates by id',
          route: [
            {
              path: '/email-templates/:id',
              method: MethodList.PUT
            }
          ]
        },
        {
          name: 'Delete email templates by id',
          route: [
            {
              path: '/email-templates/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Project Management',
      resource: 'projects',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all Projects',
          route: [
            {
              path: '/projects',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View project by id',
          route: [
            {
              path: '/projects/:id',
              method: MethodList.GET
            },
            {
              path: '/projects/:id/timeline',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Store new project',
          route: [
            {
              path: '/projects',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update project by id',
          route: [
            {
              path: '/projects/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete project by id',
          route: [
            {
              path: '/projects/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Task Management',
      resource: 'tasks',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all taskGroup',
          route: [
            {
              path: '/tasks',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task to project',
          route: [
            {
              path: '/tasks',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task o project',
          route: [
            {
              path: '/tasks/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get Project task',
          route: [
            {
              path: '/tasks/project/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task to project bulk',
          route: [
            {
              path: '/tasks/add-bulk',
              method: MethodList.POST
            }
          ]
        }
      ]
    },
    {
      name: 'Task Template Management',
      resource: 'task-template',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task template',
          route: [
            {
              path: '/task-template',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Edit task template',
          route: [
            {
              path: '/task-template/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Add task template',
          route: [
            {
              path: '/task-template',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Get task template',
          route: [
            {
              path: '/task-template/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task template',
          route: [
            {
              path: '/task-template/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Task Type Management',
      resource: 'task-type',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all task types',
          route: [
            {
              path: '/task-type',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create task type',
          route: [
            {
              path: '/task-type',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View task type by id',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update task type',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete task type',
          route: [
            {
              path: '/task-type/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Task Group Management',
      resource: 'task-group',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task group',
          route: [
            {
              path: '/task-group',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task group',
          route: [
            {
              path: '/task-group',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task group',
          route: [
            {
              path: '/task-group/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task group by id',
          route: [
            {
              path: '/task-group/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task group by id',
          route: [
            {
              path: '/task-group/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Worklog Management',
      resource: 'worklogs',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all workloglist',
          route: [
            {
              path: '/worklogs',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get My workloglist',
          route: [
            {
              path: '/worklogs/:uid',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add Worklog',
          route: [
            {
              path: '/worklogs',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit Worklog',
          route: [
            {
              path: '/worklogs/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete Worklog',
          route: [
            {
              path: '/worklogs/:id',
              method: MethodList.DELETE
            }
          ]
        },
      ]
    },
    {
      name: 'Attandence Management',
      resource: 'attendance',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all AllAttendance',
          route: [
            {
              path: '/attendance',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add Attendance',
          route: [
            {
              path: '/attendance',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit Attendance',
          route: [
            {
              path: '/attendance/:id',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Client Management',
      resource: 'client',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all Client',
          route: [
            {
              path: '/clients',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get Single Client',
          route: [
            {
              path: '/clients/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add Client',
          route: [
            {
              path: '/clients',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit Client',
          route: [
            {
              path: '/clients/:id',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Client Portal Credentials Management',
      resource: 'client-portal-credentials',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View client portal credentials',
          route: [
            {
              path: '/clients/:customerId/portal-credentials',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View client portal credential by id',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete client portal credential',
          route: [
            {
              path: '/clients/:customerId/portal-credentials/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'Portal Credentials Management',
      resource: 'portal-credentials',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all portal credentials',
          route: [
            {
              path: '/portal-credentials',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View portal credentials by id',
          route: [
            {
              path: '/portal-credentials/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View portal credentials by customer',
          route: [
            {
              path: '/portal-credentials/customer/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create portal credentials',
          route: [
            {
              path: '/portal-credentials',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Update portal credentials',
          route: [
            {
              path: '/portal-credentials/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete portal credentials',
          route: [
            {
              path: '/portal-credentials/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
{
  name: 'Billing Management',
  resource: 'billing',
  hasSubmodules: false,
  permissions: [
    {
      name: 'View all billings',
      route: [
        {
          path: '/billing',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'View billing by id',
      route: [
        {
          path: '/billing/:id',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'Store new billing',
      route: [
        {
          path: '/billing',
          method: MethodList.POST
        }
      ]
    },
    {
      name: 'Update billing by id',
      route: [
        {
          path: '/billing/:id',
          method: MethodList.PATCH
        }
      ]
    },
    {
      name: 'Delete billing by id',
      route: [
        {
          path: '/billing/:id',
          method: MethodList.DELETE
        }
      ]
    }
  ]
},

    {
      name: 'Holiday Management',
      resource: 'holiday',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all holidays',
          route: [
            {
              path: '/holiday',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Leave Management',
      resource: 'leave',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all leaves',
          route: [
            {
              path: '/leave',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Apply for leave',
          route: [
            {
              path: '/leave',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View leave by id',
          route: [
            {
              path: '/leave/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update leave',
          route: [
            {
              path: '/leave/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Leave calendar view',
          route: [
            {
              path: '/leave/calendar/view',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Work Hour Management',
      resource: 'workhour',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all work hours',
          route: [
            {
              path: '/workhour',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Resolve work hours for user',
          route: [
            {
              path: '/workhour/resolve/:userId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Calendar Management',
      resource: 'calendar',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all calendar events',
          route: [
            {
              path: '/calendar',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Calendar month view',
          route: [
            {
              path: '/calendar/month',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'AD to BS conversion',
          route: [
            {
              path: '/calendar/convert/ad-to-bs',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'BS to AD conversion',
          route: [
            {
              path: '/calendar/convert/bs-to-ad',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Legal Status Management',
      resource: 'legal-status',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all legal statuses',
          route: [
            {
              path: '/legal-status',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create legal status',
          route: [
            {
              path: '/legal-status',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View legal status by id',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update legal status',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete legal status',
          route: [
            {
              path: '/legal-status/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    }
  ],
  auditjuniorPermission: [
    {
      name: 'Task Super Project Management',
      resource: 'task-super-project',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task super projects',
          route: [
            {
              path: '/task-super-project',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task super project by id',
          route: [
            {
              path: '/task-super-project/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task super projects by project id',
          route: [
            {
              path: '/task-super-project/project/:projectId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Task Group Project Management',
      resource: 'task-group-project',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task group projects',
          route: [
            {
              path: '/task-group-project',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task group project by id',
          route: [
            {
              path: '/task-group-project/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task group projects by project id',
          route: [
            {
              path: '/task-group-project/project/:projectId',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get task group projects by task super project id',
          route: [
            {
              path: '/task-group-project/task-super-project/:taskSuperProjectId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Task Ranking Management',
      resource: 'task-ranking',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View task rankings',
          route: [
            {
              path: '/tasks/ranking',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update task rankings',
          route: [
            {
              path: '/tasks/ranking',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Task Super Management',
      resource: 'task-super',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get all task super',
          route: [
            {
              path: '/task-super',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add task super',
          route: [
            {
              path: '/task-super',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit task super',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Get task super by id',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Delete task super by id',
          route: [
            {
              path: '/task-super/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    },
    {
      name: 'User management',
      resource: 'user',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all user',
          route: [
            {
              path: '/users',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user by id',
          route: [
            {
              path: '/users/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user profile',
          route: [
            {
              path: '/users/:id/profile',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user bank details',
          route: [
            {
              path: '/users/:id/bank-detail',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user education details',
          route: [
            {
              path: '/users/:id/education-detail',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get user documents',
          route: [
            {
              path: '/users/:id/document',
              method: MethodList.GET
            }
          ]
        }
      ]
    },

    {
      name: 'Project Management',
      resource: 'projects',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all Projects',
          route: [
            {
              path: '/projects',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View project by id',
          route: [
            {
              path: '/projects/:id',
              method: MethodList.GET
            },
            {
              path: '/projects/:id/timeline',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Task Management',
      resource: 'tasks',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all taskGroup',
          route: [
            {
              path: '/tasks',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get Project task',
          route: [
            {
              path: '/tasks/project/:id',
              method: MethodList.GET
            }
          ]
        }
      ]
    },

    {
      name: 'Worklog Management',
      resource: 'worklogs',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get My workloglist',
          route: [
            {
              path: '/worklogs/:uid',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Add Worklog',
          route: [
            {
              path: '/worklogs',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Edit Worklog',
          route: [
            {
              path: '/worklogs/:id',
              method: MethodList.PATCH
            }
          ]
        }
      ]
    },
    {
      name: 'Holiday Management',
      resource: 'holiday',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all holidays',
          route: [
            {
              path: '/holiday',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Leave Management',
      resource: 'leave',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all leaves',
          route: [
            {
              path: '/leave',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Apply for leave',
          route: [
            {
              path: '/leave',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View leave by id',
          route: [
            {
              path: '/leave/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update leave',
          route: [
            {
              path: '/leave/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Leave calendar view',
          route: [
            {
              path: '/leave/calendar/view',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Work Hour Management',
      resource: 'workhour',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all work hours',
          route: [
            {
              path: '/workhour',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Resolve work hours for user',
          route: [
            {
              path: '/workhour/resolve/:userId',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Calendar Management',
      resource: 'calendar',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all calendar events',
          route: [
            {
              path: '/calendar',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Calendar month view',
          route: [
            {
              path: '/calendar/month',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'AD to BS conversion',
          route: [
            {
              path: '/calendar/convert/ad-to-bs',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'BS to AD conversion',
          route: [
            {
              path: '/calendar/convert/bs-to-ad',
              method: MethodList.GET
            }
          ]
        }
      ]
    },
    {
      name: 'Notice Board Management',
      resource: 'notice-board',
      hasSubmodules: false,
      permissions: [
        {
          name: 'View all notices',
          route: [
            {
              path: '/notice-board',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'View my notices',
          route: [
            {
              path: '/notice-board/my-notices',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Create notice',
          route: [
            {
              path: '/notice-board',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'Upload notice image',
          route: [
            {
              path: '/notice-board/upload-image',
              method: MethodList.POST
            }
          ]
        },
        {
          name: 'View notice by id',
          route: [
            {
              path: '/notice-board/:id',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Get notice read statistics',
          route: [
            {
              path: '/notice-board/:id/statistics',
              method: MethodList.GET
            }
          ]
        },
        {
          name: 'Update notice',
          route: [
            {
              path: '/notice-board/:id',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Mark notice as read',
          route: [
            {
              path: '/notice-board/:id/mark-as-read',
              method: MethodList.PATCH
            }
          ]
        },
        {
          name: 'Delete notice',
          route: [
            {
              path: '/notice-board/:id',
              method: MethodList.DELETE
            }
          ]
        }
      ]
    }
  ]
};
