import { MethodList, ModulesPayloadInterface } from '../types';

export const taskSuperModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Task Super Project Management",
    resource: "task-super-project",
    hasSubmodules: false,
    permissions: [
      {
        name: "Get all task super projects",
        route: [
          {
            path: "/task-super-project",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Add task super project",
        route: [
          {
            path: "/task-super-project",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Edit task super project",
        route: [
          {
            path: "/task-super-project/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Get task super project by id",
        route: [
          {
            path: "/task-super-project/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Delete task super project by id",
        route: [
          {
            path: "/task-super-project/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Get task super projects by project id",
        route: [
          {
            path: "/task-super-project/project/:projectId",
            method: MethodList.GET
          }
        ]
      }
    ]
  },
  {
    name: "Task Super Management",
    resource: "task-super",
    hasSubmodules: false,
    permissions: [
      {
        name: "Get all task super",
        route: [
          {
            path: "/task-super",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Add task super",
        route: [
          {
            path: "/task-super",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Edit task super",
        route: [
          {
            path: "/task-super/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Get task super by id",
        route: [
          {
            path: "/task-super/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Delete task super by id",
        route: [
          {
            path: "/task-super/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Add task super to project",
        route: [
          {
            path: "/task-super/add-to-project",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update task super rankings",
        route: [
          {
            path: "/task-super/rankings",
            method: MethodList.PATCH
          }
        ]
      }
    ]
  }
];
