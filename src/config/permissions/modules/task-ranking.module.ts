import { MethodList, ModulesPayloadInterface } from '../types';

export const taskRankingModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Task Ranking Management",
    resource: "task-ranking",
    hasSubmodules: false,
    permissions: [
      {
        name: "View task rankings",
        route: [
          {
            path: "/tasks-ranking",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update task rankings",
        route: [
          {
            path: "/tasks-ranking",
            method: MethodList.PATCH
          }
        ]
      }
    ]
  }
];
