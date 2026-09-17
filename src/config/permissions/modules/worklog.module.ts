import { MethodList, ModulesPayloadInterface } from '../types';

export const worklogModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Worklog Management",
    resource: "worklogs",
    hasSubmodules: false,
    permissions: [
      {
        name: "Get all worklogs (admin view)",
        route: [
          {
            path: "/worklogs/allworklog",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Bulk approve worklogs",
        route: [
          {
            path: "/worklogs/bulk-approve",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Bulk reject worklogs",
        route: [
          {
            path: "/worklogs/bulk-reject",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Edit worklog",
        route: [
          {
            path: "/worklogs/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Edit worklog date",
        route: [
          {
            path: "/worklogs/:id/date",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete worklog",
        route: [
          {
            path: "/worklogs/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Get worklogs by user and date",
        route: [
          {
            path: "/worklogs/user/:userId/date/:date",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Get all users worklogs by date",
        route: [
          {
            path: "/worklogs/date/:date/all-users",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View project worklogs",
        route: [
          {
            path: "/projects/:id/worklogs",
            method: MethodList.GET
          }
        ]
      }
    ]
  }
];
