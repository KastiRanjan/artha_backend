import { MethodList, ModulesPayloadInterface } from '../types';

export const calendarModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Calendar Management",
    resource: "calendar",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all calendar events",
        route: [
          {
            path: "/calendar",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create calendar event",
        route: [
          {
            path: "/calendar",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View calendar event by id",
        route: [
          {
            path: "/calendar/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update calendar event",
        route: [
          {
            path: "/calendar/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete calendar event",
        route: [
          {
            path: "/calendar/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "AD to BS conversion",
        route: [
          {
            path: "/calendar/convert/ad-to-bs",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "BS to AD conversion",
        route: [
          {
            path: "/calendar/convert/bs-to-ad",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Calendar month view",
        route: [
          {
            path: "/calendar/month",
            method: MethodList.GET
          }
        ]
      }
    ]
  }
];
