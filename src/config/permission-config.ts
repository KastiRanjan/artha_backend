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
    }
  ],
  modules: [
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
            }
          ]
        },
        {
          name: 'View project timeline',
          route: [
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
          name: 'Delete worklog',
          route: [
            { path: '/worklogs/:id', method: MethodList.DELETE }
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
    }
  ],
  projectmanagerPermission: [
    {
      name: 'User management',
      resource: 'user',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get user by id',
          route: [
            {
              path: '/users/:id',
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
    }
  ],
  auditseniorPermission: [
    {
      name: 'User management',
      resource: 'user',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get user by id',
          route: [
            {
              path: '/users/:id',
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
    }
  ],
  administratorPermission: [
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
    //ysma chai endpoint ko lagi permission thapne
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
    }
  ],
  auditjuniorPermission: [
    {
      name: 'User management',
      resource: 'user',
      hasSubmodules: false,
      permissions: [
        {
          name: 'Get user by id',
          route: [
            {
              path: '/users/:id',
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
    }
  ]
};
