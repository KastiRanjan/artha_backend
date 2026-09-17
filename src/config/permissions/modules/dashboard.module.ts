import { MethodList, ModulesPayloadInterface } from '../types';

export const dashboardModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Dashboard",
    resource: "dashboard",
    hasSubmodules: false,
    permissions: [
      {
        name: "Get user stats",
        route: [
          {
            path: "/dashboard/users",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Get os stats",
        route: [
          {
            path: "/dashboard/os",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Get browser stats",
        route: [
          {
            path: "/dashboard/browser",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View Dashboard Attendance",
        route: [
          {
            path: "/dashboard/attendance",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View Dashboard Working Time",
        route: [
          {
            path: "/dashboard/working-time",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View User Availability Dashboard",
        route: [
          {
            path: "/projects/availability/users",
            method: MethodList.GET
          }
        ]
      }
    ]
  }
];
