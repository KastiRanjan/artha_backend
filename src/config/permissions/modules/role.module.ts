import { MethodList, ModulesPayloadInterface } from '../types';

export const roleModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Role management",
    resource: "role",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all role",
        route: [
          {
            path: "/roles",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View role by id",
        route: [
          {
            path: "/roles/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Store new role",
        route: [
          {
            path: "/roles",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update role by id",
        route: [
          {
            path: "/roles/:id",
            method: MethodList.PUT
          }
        ]
      },
      {
        name: "Update role permissions",
        route: [
          {
            path: "/roles/:id/permissions",
            method: MethodList.PUT
          }
        ]
      },
      {
        name: "Delete role by id",
        route: [
          {
            path: "/roles/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Sync role defaults",
        route: [
          {
            path: "/roles/sync-defaults",
            method: MethodList.POST
          }
        ]
      }
    ]
  }
];
