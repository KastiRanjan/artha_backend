import { MethodList, ModulesPayloadInterface } from '../types';

export const taskGroupsModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Task Group Project Management",
    resource: "task-group-project",
    hasSubmodules: false,
    permissions: [
      {
        name: "Get all task group projects",
        route: [
          {
            path: "/task-group-project",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Add task group project",
        route: [
          {
            path: "/task-group-project",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Edit task group project",
        route: [
          {
            path: "/task-group-project/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Get task group project by id",
        route: [
          {
            path: "/task-group-project/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Delete task group project by id",
        route: [
          {
            path: "/task-group-project/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Get task group projects by project id",
        route: [
          {
            path: "/task-group-project/project/:projectId",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Get task group projects by task super project id",
        route: [
          {
            path: "/task-group-project/task-super-project/:taskSuperProjectId",
            method: MethodList.GET
          }
        ]
      }
    ]
  },
  {
    name: "Task Group Management",
    resource: "task-group",
    hasSubmodules: false,
    permissions: [
      {
        name: "Get all task group",
        route: [
          {
            path: "/task-group",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Add task group",
        route: [
          {
            path: "/task-group",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Edit task group",
        route: [
          {
            path: "/task-group/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Get task group by id",
        route: [
          {
            path: "/task-group/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Delete task group by id",
        route: [
          {
            path: "/task-group/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  }
];
