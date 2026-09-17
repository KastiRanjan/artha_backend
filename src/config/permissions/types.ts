export enum MethodList {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete',
  ANY = 'any',
  OPTIONS = 'options'
}

export interface RoutePayloadInterface {
  path: string;
  method: MethodList;
  resource?: string;
  description?: string;
  isDefault?: boolean;
}

export interface PermissionPayload {
  name: string;
  resource?: string;
  description?: string;
  route: Array<RoutePayloadInterface>;
}

export interface SubModulePayloadInterface {
  name: string;
  resource?: string;
  route?: string;
  permissions?: Array<PermissionPayload>;
}

export interface ModulesPayloadInterface {
  name: string;
  resource: string;
  hasSubmodules: boolean;
  route?: string;
  submodules?: Array<SubModulePayloadInterface>;
  permissions?: Array<PermissionPayload>;
}

export interface RolePayload {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

export interface PermissionConfigInterface {
  roles: Array<RolePayload>;
  defaultRoutes?: Array<RoutePayloadInterface>;
  publicRoutes?: Array<RoutePayloadInterface>;
  authenticatedDefaultRoutes?: Array<RoutePayloadInterface>;
  modules: Array<ModulesPayloadInterface>;
  projectmanagerPermission?: Array<ModulesPayloadInterface>;
  auditseniorPermission?: Array<ModulesPayloadInterface>;
  administratorPermission?: Array<ModulesPayloadInterface>;
  auditjuniorPermission?: Array<ModulesPayloadInterface>;
  roleDefaults?: Record<string, string[] | 'ALL'>;
}
