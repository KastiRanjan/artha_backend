import { MethodList, ModulesPayloadInterface } from '../types';

export const projectEvaluationModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Project Evaluation Management",
    resource: "project-evaluation",
    hasSubmodules: false,
    permissions: [
      {
        name: "Create project evaluation",
        route: [
          {
            path: "/project-evaluation",
            method: MethodList.POST,
            resource: "project-evaluation",
            description: "Create project evaluation for a user"
          }
        ]
      },
      {
        name: "View all evaluations",
        route: [
          {
            path: "/project-evaluation",
            method: MethodList.GET,
            resource: "project-evaluation",
            description: "View all evaluations"
          }
        ]
      },
      {
        name: "View evaluations by project",
        route: [
          {
            path: "/project-evaluation/project/:projectId",
            method: MethodList.GET,
            resource: "project-evaluation",
            description: "View all evaluations for a project"
          }
        ]
      },
      {
        name: "View evaluations by user",
        route: [
          {
            path: "/project-evaluation/user/:userId",
            method: MethodList.GET,
            resource: "project-evaluation",
            description: "View all evaluations for a user"
          }
        ]
      },
      {
        name: "View single evaluation",
        route: [
          {
            path: "/project-evaluation/:id",
            method: MethodList.GET,
            resource: "project-evaluation",
            description: "View single evaluation"
          }
        ]
      },
      {
        name: "Update evaluation",
        route: [
          {
            path: "/project-evaluation/:id",
            method: MethodList.PATCH,
            resource: "project-evaluation",
            description: "Update evaluation"
          }
        ]
      },
      {
        name: "Delete evaluation",
        route: [
          {
            path: "/project-evaluation/:id",
            method: MethodList.DELETE,
            resource: "project-evaluation",
            description: "Delete evaluation"
          }
        ]
      }
    ]
  },
  {
    name: "Project Sign-off Management",
    resource: "project-signoff",
    hasSubmodules: false,
    permissions: [
      {
        name: "Create project signoff",
        route: [
          {
            path: "/project-signoff",
            method: MethodList.POST,
            resource: "project-signoff",
            description: "Create project signoff"
          }
        ]
      },
      {
        name: "View all signoffs",
        route: [
          {
            path: "/project-signoff",
            method: MethodList.GET,
            resource: "project-signoff",
            description: "View all signoffs"
          }
        ]
      },
      {
        name: "View signoff by project",
        route: [
          {
            path: "/project-signoff/project/:projectId",
            method: MethodList.GET,
            resource: "project-signoff",
            description: "View signoff for a project"
          }
        ]
      },
      {
        name: "View single signoff",
        route: [
          {
            path: "/project-signoff/:id",
            method: MethodList.GET,
            resource: "project-signoff",
            description: "View single signoff"
          }
        ]
      },
      {
        name: "Update signoff",
        route: [
          {
            path: "/project-signoff/:id",
            method: MethodList.PATCH,
            resource: "project-signoff",
            description: "Update signoff"
          }
        ]
      },
      {
        name: "Delete signoff",
        route: [
          {
            path: "/project-signoff/:id",
            method: MethodList.DELETE,
            resource: "project-signoff",
            description: "Delete signoff"
          }
        ]
      }
    ]
  }
];
