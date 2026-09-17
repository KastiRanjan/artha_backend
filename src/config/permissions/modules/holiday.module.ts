import { MethodList, ModulesPayloadInterface } from '../types';

export const holidayModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Holiday Management",
    resource: "holiday",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all holidays",
        route: [
          {
            path: "/holiday",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Add holiday",
        route: [
          {
            path: "/holiday",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View holiday by id",
        route: [
          {
            path: "/holiday/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update holiday",
        route: [
          {
            path: "/holiday/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete holiday",
        route: [
          {
            path: "/holiday/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Import holidays CSV",
        route: [
          {
            path: "/holiday/import-csv",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Preview holidays CSV",
        route: [
          {
            path: "/holiday/preview-csv",
            method: MethodList.POST
          }
        ]
      }
    ]
  }
];
