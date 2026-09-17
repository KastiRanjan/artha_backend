import { MethodList, ModulesPayloadInterface } from '../types';

export const tasksModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Task Management",
    resource: "tasks",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all tasks",
        route: [
          {
            path: "/tasks",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Add task",
        route: [
          {
            path: "/tasks",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Add tasks in bulk",
        route: [
          {
            path: "/tasks/add-bulk",
            method: MethodList.POST,
            description: "Add tasks in bulk"
          },
          {
            path: "/tasks/add-bulk-list",
            method: MethodList.POST,
            description: "Add tasks in bulk list"
          }
        ]
      },
      {
        name: "Get task by id",
        route: [
          {
            path: "/tasks/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Get tasks by project id",
        route: [
          {
            path: "/tasks/project/:id",
            method: MethodList.GET,
            description: "Get tasks by project id"
          },
          {
            path: "/tasks/:tid/project/:pid",
            method: MethodList.GET,
            description: "Get task in project by task id"
          }
        ]
      },
      {
        name: "Get tasks by project and user",
        route: [
          {
            path: "/tasks/project/:pid/user/:uid",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update task by id",
        route: [
          {
            path: "/tasks/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Bulk update tasks",
        route: [
          {
            path: "/tasks/bulk-update",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete task by id",
        route: [
          {
            path: "/tasks/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Mark tasks complete",
        route: [
          {
            path: "/tasks/mark-complete",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Complete all task",
        route: [
          {
            path: "/tasks/project/:projectId/complete-all",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "first-verify-task",
        route: [
          {
            path: "/tasks/first-verify",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "second-verify-task",
        route: [
          {
            path: "/tasks/second-verify",
            method: MethodList.PATCH
          }
        ]
      }
    ]
  }
];
