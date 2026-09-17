import { MethodList, RoutePayloadInterface } from './types';

/**
 * Public routes accessible without any authentication (no JWT required).
 */
export const PublicRoutes: RoutePayloadInterface[] = [
  {
    path: "/check",
    method: MethodList.GET
  },
  {
    path: "/auth/register",
    method: MethodList.POST
  },
  {
    path: "/auth/login",
    method: MethodList.POST
  },
  {
    path: "/auth/activate-account",
    method: MethodList.GET
  },
  {
    path: "/auth/forgot-password",
    method: MethodList.PUT
  },
  {
    path: "/auth/reset-password",
    method: MethodList.PUT
  },
  {
    path: "/logout",
    method: MethodList.POST
  },
  {
    path: "/client-portal/login",
    method: MethodList.POST
  },
  {
    path: "/client-portal/logout",
    method: MethodList.POST
  },
  {
    path: "/client-portal/forgot-password",
    method: MethodList.POST
  },
  {
    path: "/client-portal/reset-password",
    method: MethodList.POST
  }
];

/**
 * Baseline self-service employee routes requiring valid JWT authentication,
 * but no specific role-permission check.
 * 
 * Data security is strictly enforced at the service/query layer 
 * (e.g. scoping to req.user.id or assigned project members).
 */
export const AuthenticatedDefaultRoutes: RoutePayloadInterface[] = [
  // --- Auth & Account Self-Service ---
  {
    path: "/auth/profile",
    method: MethodList.GET
  },
  {
    path: "/auth/profile",
    method: MethodList.PUT
  },
  {
    path: "/auth/change-password",
    method: MethodList.PUT
  },
  {
    path: "/auth/token-info",
    method: MethodList.GET
  },
  {
    path: "/revoke/:id",
    method: MethodList.PUT
  },
  {
    path: "/dashboard/users",
    method: MethodList.GET
  },
  {
    path: "/dashboard/os",
    method: MethodList.GET
  },
  {
    path: "/dashboard/browser",
    method: MethodList.GET
  },

  // --- Attendance Self-Service ---
  {
    path: "/attendance",
    method: MethodList.POST // Clock in / clock out for oneself
  },
  {
    path: "/attendance",
    method: MethodList.GET // View own attendance history
  },
  {
    path: "/attendance/today-attendence",
    method: MethodList.GET // View own status today
  },

  // --- Worklogs Self-Service ---
  {
    path: "/worklogs",
    method: MethodList.POST // Log work for oneself
  },
  {
    path: "/worklogs",
    method: MethodList.GET // View own worklogs
  },
  {
    path: "/worklogs/user",
    method: MethodList.GET // View user worklogs
  },
  {
    path: "/worklogs/:id",
    method: MethodList.GET // View worklog by id
  },
  {
    path: "/worklogs/task/:id",
    method: MethodList.GET // View worklogs by task
  },

  // --- Tasks Self-Service ---
  {
    path: "/tasks/user",
    method: MethodList.GET // View tasks assigned to current user
  },

  // --- Projects Self-Service ---
  {
    path: "/projects",
    method: MethodList.GET // Lists only projects where user is member
  },
  {
    path: "/projects/:id",
    method: MethodList.GET // View project details
  },
  {
    path: "/projects/:id/timeline",
    method: MethodList.GET // View project timeline
  },

  // --- Notice Board Self-Service ---
  {
    path: "/notice-board",
    method: MethodList.GET // View company notices
  },
  {
    path: "/notice-board/my-notices",
    method: MethodList.GET // View my notices
  },
  {
    path: "/notice-board/:id",
    method: MethodList.GET // View notice details
  },
  {
    path: "/notice-board/:id/mark-as-read",
    method: MethodList.PATCH // Mark notice as read
  },

  // --- Notifications Self-Service ---
  {
    path: "/notification/user/:userId",
    method: MethodList.GET
  },
  {
    path: "/notification/read/:userId/:notificationId",
    method: MethodList.PATCH
  },
  {
    path: "/notification/read-all/:userId/:type",
    method: MethodList.PATCH
  },
  {
    path: "/notification/unread/:userId/:notificationId",
    method: MethodList.PATCH
  },
  {
    path: "/notification/archive/:userId/:notificationId",
    method: MethodList.PATCH
  },
  {
    path: "/notification/user/:userId/:notificationId",
    method: MethodList.DELETE
  },

  // --- Leave Self-Service ---
  {
    path: "/leave",
    method: MethodList.POST // Apply for leave
  },
  {
    path: "/leave/my-leaves",
    method: MethodList.GET // View own leaves
  },
  {
    path: "/leave/balance/my",
    method: MethodList.GET // View own balance
  },
  {
    path: "/leave/balance/:userId",
    method: MethodList.GET
  },
  {
    path: "/leave/balance/:userId/:leaveType",
    method: MethodList.GET
  },
  {
    path: "/leave/calendar/view",
    method: MethodList.GET
  },
  {
    path: "/leave/approvals/pending",
    method: MethodList.GET
  },
  {
    path: "/leave/:id/approve",
    method: MethodList.PATCH
  },

  // --- Calendar & Holidays ---
  {
    path: "/holiday",
    method: MethodList.GET
  },
  {
    path: "/calendar",
    method: MethodList.GET
  },

  // --- Todo Tasks Self-Service ---
  {
    path: "/todo-task",
    method: MethodList.GET
  },
  {
    path: "/todo-task",
    method: MethodList.POST
  },
  {
    path: "/todo-task/:id",
    method: MethodList.PATCH
  },
  {
    path: "/todo-task/:id",
    method: MethodList.DELETE
  },

  // --- Client Portal (Authenticated) ---
  {
    path: "/client-portal/profile",
    method: MethodList.GET
  },
  {
    path: "/client-portal/reports",
    method: MethodList.GET
  },
  {
    path: "/client-portal/reports/stats",
    method: MethodList.GET
  },
  {
    path: "/client-portal/reports/:id",
    method: MethodList.GET
  },
  {
    path: "/client-portal/reports/:id/download",
    method: MethodList.GET
  },
  {
    path: "/client-portal/change-password",
    method: MethodList.POST
  },

  // --- DSA Self-Service ---
  {
    path: "/dsa",
    method: MethodList.POST
  },
  {
    path: "/dsa/project/:projectId",
    method: MethodList.GET
  },
  {
    path: "/dsa/:id",
    method: MethodList.GET
  },
  {
    path: "/dsa/:id/approve",
    method: MethodList.PATCH
  },
  {
    path: "/dsa/:id/reject",
    method: MethodList.PATCH
  },
  {
    path: "/dsa/:id/settle",
    method: MethodList.PATCH
  },
  {
    path: "/dsa/:id/verify",
    method: MethodList.PATCH
  }
];

/**
 * Combined default routes for backward compatibility.
 */
export const DefaultRoutes: RoutePayloadInterface[] = [
  ...PublicRoutes,
  ...AuthenticatedDefaultRoutes
];
