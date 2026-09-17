import { MethodList, ModulesPayloadInterface } from '../types';

export const permissionModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Permission management",
    resource: "permission",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all permission",
        route: [
          {
            path: "/permissions",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Sync permission from config",
        route: [
          {
            path: "/permissions/sync",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View permission by id",
        route: [
          {
            path: "/permissions/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Store new permission",
        route: [
          {
            path: "/permissions",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update permission by id",
        route: [
          {
            path: "/permissions/:id",
            method: MethodList.PUT
          }
        ]
      },
      {
        name: "Delete permission by id",
        route: [
          {
            path: "/permissions/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  }
];
