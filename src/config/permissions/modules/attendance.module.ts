import { MethodList, ModulesPayloadInterface } from '../types';

export const attendanceModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Attendance Management",
    resource: "attendance",
    hasSubmodules: false,
    permissions: [
      {
        name: "Export attendance helper",
        route: [
          {
            path: "/attendance/export",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View All Users Attendance",
        route: [
          {
            path: "/attendance/all-users",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View Today All Users Attendance",
        route: [
          {
            path: "/attendance/today-all-users",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View Date-wise All Users Attendance",
        route: [
          {
            path: "/attendance/date-wise-all-users",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Get Attendance by User ID",
        route: [
          {
            path: "/attendance/user/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Get Attendance by ID",
        route: [
          {
            path: "/attendance/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Edit Attendance",
        route: [
          {
            path: "/attendance/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete Attendance by ID",
        route: [
          {
            path: "/attendance/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  }
];
