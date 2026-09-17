import { MethodList, ModulesPayloadInterface } from '../types';

export const leaveModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Leave Management",
    resource: "leave",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all leaves",
        route: [
          {
            path: "/leave",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update leave",
        route: [
          {
            path: "/leave/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete leave",
        route: [
          {
            path: "/leave/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Approve leave (any)",
        route: [
          {
            path: "/leave/:id/approve",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Approve leave by lead",
        route: [
          {
            path: "/leave/:id/approve/lead",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Approve leave by PM",
        route: [
          {
            path: "/leave/:id/approve/pm",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Approve leave by admin",
        route: [
          {
            path: "/leave/:id/approve/admin",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Reject leave",
        route: [
          {
            path: "/leave/:id/reject",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "View user leaves",
        route: [
          {
            path: "/leave/user/:userId",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Allocate leave to user",
        route: [
          {
            path: "/leave/balance/allocate",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Allocate leave to all users",
        route: [
          {
            path: "/leave/balance/allocate-all",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Carry over leave",
        route: [
          {
            path: "/leave/balance/carry-over",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View leave balances by user and year",
        route: [
          {
            path: "/leave/balance/user/:userId/year/:year",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View user leave balances",
        route: [
          {
            path: "/leave/balance/:userId",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View specific leave balance",
        route: [
          {
            path: "/leave/balance/:userId/:leaveType",
            method: MethodList.GET
          }
        ]
      }
    ]
  }
];
