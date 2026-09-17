import { MethodList, ModulesPayloadInterface } from '../types';

export const noticeBoardModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Notice Board Management",
    resource: "notice-board",
    hasSubmodules: false,
    permissions: [
      {
        name: "Create notice",
        route: [
          {
            path: "/notice-board",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Upload notice image",
        route: [
          {
            path: "/notice-board/upload-image",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update notice",
        route: [
          {
            path: "/notice-board/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete notice",
        route: [
          {
            path: "/notice-board/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Get notice read statistics",
        route: [
          {
            path: "/notice-board/:id/statistics",
            method: MethodList.GET
          }
        ]
      }
    ]
  }
];
