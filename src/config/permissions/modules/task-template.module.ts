import { MethodList, ModulesPayloadInterface } from '../types';

export const taskTemplateModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Task Template Management",
    resource: "task-template",
    hasSubmodules: false,
    permissions: [
      {
        name: "Get all task template",
        route: [
          {
            path: "/task-template",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Edit task template",
        route: [
          {
            path: "/task-template/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Add task template",
        route: [
          {
            path: "/task-template",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Get task template",
        route: [
          {
            path: "/task-template/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Delete task template",
        route: [
          {
            path: "/task-template/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  }
];
