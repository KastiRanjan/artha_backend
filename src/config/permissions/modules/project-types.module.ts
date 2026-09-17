import { MethodList, ModulesPayloadInterface } from '../types';

export const projectTypesModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Project Types",
    resource: "nature-of-work",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all Project Types",
        route: [
          {
            path: "/nature-of-work",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View Project Type by id",
        route: [
          {
            path: "/nature-of-work/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create Project Type",
        route: [
          {
            path: "/nature-of-work",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update Project Type",
        route: [
          {
            path: "/nature-of-work/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete Project Type",
        route: [
          {
            path: "/nature-of-work/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "View all Project Type Groups",
        route: [
          {
            path: "/nature-of-work/group/all",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View Project Type Group by id",
        route: [
          {
            path: "/nature-of-work/group/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create Project Type Group",
        route: [
          {
            path: "/nature-of-work/group",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update Project Type Group",
        route: [
          {
            path: "/nature-of-work/group/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete Project Type Group",
        route: [
          {
            path: "/nature-of-work/group/:id",
            method: MethodList.DELETE
          }
        ]
      },
      {
        name: "View affected projects by Project Type",
        route: [
          {
            path: "/nature-of-work/:id/affected-projects",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View active affected projects by Project Type",
        route: [
          {
            path: "/nature-of-work/:id/active-affected-projects",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Migrate Project Type",
        route: [
          {
            path: "/nature-of-work/migrate",
            method: MethodList.POST
          }
        ]
      }
    ]
  }
];
