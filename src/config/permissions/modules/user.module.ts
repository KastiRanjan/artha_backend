import { MethodList, ModulesPayloadInterface } from '../types';

export const userModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "User management",
    resource: "user",
    hasSubmodules: false,
    permissions: [
      {
        name: "List active users",
        route: [
          {
            path: "/users/list-active",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View all user",
        route: [
          {
            path: "/users",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Store new user",
        route: [
          {
            path: "/users",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update user by id",
        route: [
          {
            path: "/users/edit/:id",
            method: MethodList.PUT,
            description: "Update user by id (PUT)"
          },
          {
            path: "/users/edit/:id",
            method: MethodList.PATCH,
            description: "Update user by id (PATCH)"
          }
        ]
      },
      {
        name: "Get user by id",
        route: [
          {
            path: "/users/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Delete user by id",
        route: [
          {
            path: "/users/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Get user profile",
        route: [
          {
            path: "/users/:id/profile",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create user profile",
        route: [
          {
            path: "/users/:id/profile",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update user profile",
        route: [
          {
            path: "/users/:id/profile",
            method: MethodList.PUT,
            description: "Update user profile (PUT)"
          },
          {
            path: "/users/:id/profile",
            method: MethodList.PATCH,
            description: "Update user profile (PATCH)"
          }
        ]
      },
      {
        name: "Get user bank details",
        route: [
          {
            path: "/users/:id/bank-detail",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create user bank details",
        route: [
          {
            path: "/users/:id/bank-detail",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update user bank details",
        route: [
          {
            path: "/users/:id/bank-detail",
            method: MethodList.PUT,
            description: "Update user bank details (PUT)"
          },
          {
            path: "/users/:id/bank-detail",
            method: MethodList.PATCH,
            description: "Update user bank details (PATCH)"
          }
        ]
      },
      {
        name: "Get user education details",
        route: [
          {
            path: "/users/:id/education-detail",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create user education details",
        route: [
          {
            path: "/users/:id/education-detail",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update user education details",
        route: [
          {
            path: "/users/:id/education-detail",
            method: MethodList.PUT,
            description: "Update user education details (PUT)"
          },
          {
            path: "/users/:id/education-detail",
            method: MethodList.PATCH,
            description: "Update user education details (PATCH)"
          }
        ]
      },
      {
        name: "Get user documents",
        route: [
          {
            path: "/users/:id/document",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Upload user documents",
        route: [
          {
            path: "/users/:id/document",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Delete user document",
        route: [
          {
            path: "/users/:id/document/:documentId",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Update user status",
        route: [
          {
            path: "/users/:id/status",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Edit user profile details",
        resource: "edit_user_profile_details",
        route: [
          {
            path: "/users/:id",
            method: MethodList.PATCH,
            description: "Edit any user profile information including personal details, status, role, etc."
          },
          {
            path: "/users/:id/upload",
            method: MethodList.POST,
            description: "Upload documents for any user"
          },
          {
            path: "/users/:id",
            method: MethodList.POST,
            description: "Create user details (profile, bank, education, etc.)"
          }
        ]
      },
      {
        name: "Get user history",
        route: [
          {
            path: "/users/:id/history",
            method: MethodList.GET
          }
        ]
      }
    ]
  }
];
