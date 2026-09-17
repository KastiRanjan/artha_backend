import { MethodList, ModulesPayloadInterface } from '../types';

export const taskTypeModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Task Type Management",
    resource: "task-type",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all task types",
        route: [
          {
            path: "/task-type",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create task type",
        route: [
          {
            path: "/task-type",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View task type by id",
        route: [
          {
            path: "/task-type/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update task type",
        route: [
          {
            path: "/task-type/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete task type",
        route: [
          {
            path: "/task-type/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  }
];
