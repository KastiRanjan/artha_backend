import { MethodList, ModulesPayloadInterface } from '../types';

export const workhourModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Work Hour Management",
    resource: "workhour",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all work hours",
        route: [
          {
            path: "/workhour",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create work hour config",
        route: [
          {
            path: "/workhour",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View work hour by id",
        route: [
          {
            path: "/workhour/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update work hour config",
        route: [
          {
            path: "/workhour/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete work hour config",
        route: [
          {
            path: "/workhour/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Resolve work hours for user",
        route: [
          {
            path: "/workhour/resolve/:userId",
            method: MethodList.GET
          }
        ]
      }
    ]
  }
];
