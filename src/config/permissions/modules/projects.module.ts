import { MethodList, ModulesPayloadInterface } from '../types';

export const projectsModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Project Management",
    resource: "projects",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all Projects",
        route: [
          {
            path: "/projects",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View project by id",
        route: [
          {
            path: "/projects/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View project timeline",
        route: [
          {
            path: "/projects/:id/timeline",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View user projects",
        route: [
          {
            path: "/projects/users/:uid",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Store new project",
        route: [
          {
            path: "/projects",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update project by id",
        route: [
          {
            path: "/projects/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete project by id",
        route: [
          {
            path: "/projects/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "Add tasks from templates",
        route: [
          {
            path: "/projects/add-from-templates",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Mark project as completed",
        route: [
          {
            path: "/projects/:id/complete",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Export project to Excel",
        route: [
          {
            path: "/projects/:id/export",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Export projects helper",
        route: [
          {
            path: "/projects/export",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Assign user to project",
        route: [
          {
            path: "/projects/:id/users/assign",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Release user from project",
        route: [
          {
            path: "/projects/:id/users/:userId/release",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Update user assignment",
        route: [
          {
            path: "/projects/:id/users/:userId",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "View project user assignments",
        route: [
          {
            path: "/projects/:id/users/assignments",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View user project assignments",
        route: [
          {
            path: "/projects/users/:userId/assignments",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View user availability",
        route: [
          {
            path: "/projects/availability/users",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View user availability timeline",
        route: [
          {
            path: "/projects/availability/timeline",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View specific user availability",
        route: [
          {
            path: "/projects/availability/users/:userId",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View available users",
        route: [
          {
            path: "/projects/availability/available",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View users available by date",
        route: [
          {
            path: "/projects/availability/available-by",
            method: MethodList.GET
          }
        ]
      }
    ]
  }
];
