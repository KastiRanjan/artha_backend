import { MethodList, ModulesPayloadInterface } from '../types';

export const clientModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Client Management",
    resource: "client",
    hasSubmodules: false,
    permissions: [
      {
        name: "Get all Client",
        route: [
          {
            path: "/clients",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Get Single Client",
        route: [
          {
            path: "/clients/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Add Client",
        route: [
          {
            path: "/clients",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Edit Client",
        route: [
          {
            path: "/clients/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Export clients helper",
        route: [
          {
            path: "/clients/export",
            method: MethodList.GET
          }
        ]
      }
    ]
  },
  {
    name: "Client Portal Credentials Management",
    resource: "client-portal-credentials",
    hasSubmodules: false,
    permissions: [
      {
        name: "View client portal credentials",
        route: [
          {
            path: "/clients/:customerId/portal-credentials",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View client portal credential by id",
        route: [
          {
            path: "/clients/:customerId/portal-credentials/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create client portal credential",
        route: [
          {
            path: "/clients/:customerId/portal-credentials",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update client portal credential",
        route: [
          {
            path: "/clients/:customerId/portal-credentials/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete client portal credential",
        route: [
          {
            path: "/clients/:customerId/portal-credentials/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  },
  {
    name: "Portal Credentials Management",
    resource: "portal-credentials",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all portal credentials",
        route: [
          {
            path: "/portal-credentials",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View portal credentials by id",
        route: [
          {
            path: "/portal-credentials/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "View portal credentials by customer",
        route: [
          {
            path: "/portal-credentials/customer/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create portal credentials",
        route: [
          {
            path: "/portal-credentials",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "Update portal credentials",
        route: [
          {
            path: "/portal-credentials/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete portal credentials",
        route: [
          {
            path: "/portal-credentials/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  },
  {
    name: "Client Reports Management",
    resource: "client-reports",
    hasSubmodules: false,
    permissions: [
      {
        name: "Get all client reports",
        route: [
          {
            path: "/client-reports",
            method: MethodList.GET,
            resource: "client-reports",
            description: "View all client reports"
          }
        ]
      },
      {
        name: "Create client report",
        route: [
          {
            path: "/client-reports",
            method: MethodList.POST,
            resource: "client-reports",
            description: "Upload new client report"
          }
        ]
      },
      {
        name: "Update client report",
        route: [
          {
            path: "/client-reports/:id",
            method: MethodList.PATCH,
            resource: "client-reports",
            description: "Update client report details"
          }
        ]
      },
      {
        name: "Delete client report",
        route: [
          {
            path: "/client-reports/:id",
            method: MethodList.DELETE,
            resource: "client-reports",
            description: "Delete a client report"
          }
        ]
      },
      {
        name: "Update report access",
        route: [
          {
            path: "/client-reports/:id/access",
            method: MethodList.PATCH,
            resource: "client-reports",
            description: "Grant or revoke download access"
          }
        ]
      },
      {
        name: "Bulk update report access",
        route: [
          {
            path: "/client-reports/bulk-access",
            method: MethodList.POST,
            resource: "client-reports",
            description: "Bulk grant or revoke download access"
          }
        ]
      },
      {
        name: "Replace report file",
        route: [
          {
            path: "/client-reports/:id/file",
            method: MethodList.PUT,
            resource: "client-reports",
            description: "Replace file for existing report"
          }
        ]
      },
      {
        name: "View customer reports",
        route: [
          {
            path: "/client-reports/customer/:customerId",
            method: MethodList.GET,
            resource: "client-reports",
            description: "View reports for specific customer"
          }
        ]
      },
      {
        name: "View customer stats",
        route: [
          {
            path: "/client-reports/customer/:customerId/stats",
            method: MethodList.GET,
            resource: "client-reports",
            description: "View report stats for customer"
          }
        ]
      },
      {
        name: "View customer projects",
        route: [
          {
            path: "/client-reports/customer/:customerId/projects",
            method: MethodList.GET,
            resource: "client-reports",
            description: "View projects for customer dropdown"
          }
        ]
      },
      {
        name: "Get single client report",
        route: [
          {
            path: "/client-reports/:id",
            method: MethodList.GET,
            resource: "client-reports",
            description: "View single client report by ID"
          }
        ]
      },
      {
        name: "Get staff accessible reports",
        route: [
          {
            path: "/client-reports/staff/reports",
            method: MethodList.GET,
            resource: "client-reports",
            description: "Get reports scoped to the current staff user's accessible customers"
          }
        ]
      }
    ]
  },
  {
    name: "Client Report Document Types",
    resource: "client-report-document-type",
    hasSubmodules: false,
    permissions: [
      {
        name: "Get all document types",
        route: [
          {
            path: "/client-report-document-type",
            method: MethodList.GET,
            resource: "client-report-document-type",
            description: "View all client report document types"
          }
        ]
      },
      {
        name: "Get active document types",
        route: [
          {
            path: "/client-report-document-type/active",
            method: MethodList.GET,
            resource: "client-report-document-type",
            description: "View active client report document types"
          }
        ]
      },
      {
        name: "Get global document types",
        route: [
          {
            path: "/client-report-document-type/global",
            method: MethodList.GET,
            resource: "client-report-document-type",
            description: "View global client report document types"
          }
        ]
      },
      {
        name: "Get document types for customer",
        route: [
          {
            path: "/client-report-document-type/customer/:customerId",
            method: MethodList.GET,
            resource: "client-report-document-type",
            description: "View document types for specific customer"
          }
        ]
      },
      {
        name: "Get document types with counts",
        route: [
          {
            path: "/client-report-document-type/with-counts",
            method: MethodList.GET,
            resource: "client-report-document-type",
            description: "View document types with report counts"
          }
        ]
      },
      {
        name: "Create document type",
        route: [
          {
            path: "/client-report-document-type",
            method: MethodList.POST,
            resource: "client-report-document-type",
            description: "Create new client report document type"
          }
        ]
      },
      {
        name: "Update document type",
        route: [
          {
            path: "/client-report-document-type/:id",
            method: MethodList.PATCH,
            resource: "client-report-document-type",
            description: "Update client report document type"
          }
        ]
      },
      {
        name: "Delete document type",
        route: [
          {
            path: "/client-report-document-type/:id",
            method: MethodList.DELETE,
            resource: "client-report-document-type",
            description: "Delete client report document type"
          }
        ]
      },
      {
        name: "Toggle document type status",
        route: [
          {
            path: "/client-report-document-type/:id/toggle-status",
            method: MethodList.PATCH,
            resource: "client-report-document-type",
            description: "Toggle document type active status"
          }
        ]
      }
    ]
  },
  {
    name: "Client Users Management",
    resource: "client-users",
    hasSubmodules: false,
    permissions: [
      {
        name: "Get all client users",
        route: [
          {
            path: "/client-users",
            method: MethodList.GET,
            resource: "client-users",
            description: "View all client portal users"
          }
        ]
      },
      {
        name: "Create client user",
        route: [
          {
            path: "/client-users",
            method: MethodList.POST,
            resource: "client-users",
            description: "Create new client portal user"
          }
        ]
      },
      {
        name: "Update client user",
        route: [
          {
            path: "/client-users/:id",
            method: MethodList.PATCH,
            resource: "client-users",
            description: "Update client portal user"
          }
        ]
      },
      {
        name: "Delete client user",
        route: [
          {
            path: "/client-users/:id",
            method: MethodList.DELETE,
            resource: "client-users",
            description: "Delete client portal user"
          }
        ]
      }
    ]
  }
];
