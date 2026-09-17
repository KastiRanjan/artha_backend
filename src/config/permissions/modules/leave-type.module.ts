import { MethodList, ModulesPayloadInterface } from '../types';

export const leaveTypeModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Leave Type Management",
    resource: "leave-type",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all leave types",
        route: [
          {
            path: "/leave-type",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View active leave types",
        route: [
          {
            path: "/leave-type/active",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create leave type",
        route: [
          {
            path: "/leave-type",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View leave type by id",
        route: [
          {
            path: "/leave-type/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update leave type",
        route: [
          {
            path: "/leave-type/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete leave type",
        route: [
          {
            path: "/leave-type/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Toggle leave type status",
        route: [
          {
            path: "/leave-type/:id/toggle-status",
            method: MethodList.PATCH
          }
        ]
      }
    ]
  }
];
