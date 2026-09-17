import { MethodList, ModulesPayloadInterface } from '../types';

export const settingsModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Reports Management",
    resource: "reports",
    hasSubmodules: false,
    permissions: [
      {
        name: "View reports dashboard",
        route: [
          {
            path: "/reports",
            method: MethodList.GET,
            description: "View reports dashboard"
          },
          {
            path: "/reports/worklog",
            method: MethodList.GET,
            description: "View worklog reports"
          },
          {
            path: "/reports/manager",
            method: MethodList.GET,
            description: "View manager reports"
          }
        ]
      }
    ]
  },
  {
    name: "Department Management",
    resource: "department",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all departments",
        route: [
          {
            path: "/department",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View department by id",
        route: [
          {
            path: "/department/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create department",
        route: [
          {
            path: "/department",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update department",
        route: [
          {
            path: "/department/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Toggle department active status",
        route: [
          {
            path: "/department/:id/toggle-active",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete department",
        route: [
          {
            path: "/department/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  },
  {
    name: "DSA Management",
    resource: "dsa",
    hasSubmodules: false,
    permissions: [
      {
        name: "Create DSA",
        route: [
          {
            path: "/dsa",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View DSA by Project",
        route: [
          {
            path: "/dsa/project/:projectId",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View DSA details",
        route: [
          {
            path: "/dsa/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Approve DSA",
        route: [
          {
            path: "/dsa/:id/approve",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Reject DSA",
        route: [
          {
            path: "/dsa/:id/reject",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Settle DSA",
        route: [
          {
            path: "/dsa/:id/settle",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Verify DSA",
        route: [
          {
            path: "/dsa/:id/verify",
            method: MethodList.PATCH
          }
        ]
      }
    ]
  },
  {
    name: "Email Templates",
    resource: "emailTemplates",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all email templates",
        route: [
          {
            path: "/email-templates",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View email templates by id",
        route: [
          {
            path: "/email-templates/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Store new email templates",
        route: [
          {
            path: "/email-templates",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update email templates by id",
        route: [
          {
            path: "/email-templates/:id",
            method: MethodList.PUT
          }
        ]
      },
      {
        name: "Delete email templates by id",
        route: [
          {
            path: "/email-templates/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  },
  {
    name: "Mail Settings",
    resource: "mailSettings",
    hasSubmodules: false,
    permissions: [
      {
        name: "View mail settings",
        route: [
          {
            path: "/mail-settings",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update mail settings",
        route: [
          {
            path: "/mail-settings",
            method: MethodList.PUT
          }
        ]
      }
    ]
  },
  {
    name: "Billing Management",
    resource: "billing",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all billings",
        route: [
          {
            path: "/billing",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View billing by id",
        route: [
          {
            path: "/billing/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Store new billing",
        route: [
          {
            path: "/billing",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update billing by id",
        route: [
          {
            path: "/billing/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete billing by id",
        route: [
          {
            path: "/billing/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  },
  {
    name: "Business Size Management",
    resource: "business-size",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all business sizes",
        route: [
          {
            path: "/business-size",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create business size",
        route: [
          {
            path: "/business-size",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View business size by id",
        route: [
          {
            path: "/business-size/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update business size",
        route: [
          {
            path: "/business-size/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete business size",
        route: [
          {
            path: "/business-size/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  },
  {
    name: "Business Nature Management",
    resource: "business-nature",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all business natures",
        route: [
          {
            path: "/business-nature",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create business nature",
        route: [
          {
            path: "/business-nature",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View business nature by id",
        route: [
          {
            path: "/business-nature/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update business nature",
        route: [
          {
            path: "/business-nature/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete business nature",
        route: [
          {
            path: "/business-nature/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  },
  {
    name: "Legal Status Management",
    resource: "legal-status",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all legal statuses",
        route: [
          {
            path: "/legal-status",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create legal status",
        route: [
          {
            path: "/legal-status",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View legal status by id",
        route: [
          {
            path: "/legal-status/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update legal status",
        route: [
          {
            path: "/legal-status/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete legal status",
        route: [
          {
            path: "/legal-status/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  }
];
