import { MethodList, ModulesPayloadInterface } from '../types';

export const notificationModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Notification Management",
    resource: "notification",
    hasSubmodules: false,
    permissions: [
      {
        name: "Create notification",
        route: [
          {
            path: "/notification",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View all notifications",
        route: [
          {
            path: "/notification",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View notification by id",
        route: [
          {
            path: "/notification/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update notification by id",
        route: [
          {
            path: "/notification/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete notification by id",
        route: [
          {
            path: "/notification/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  }
];
