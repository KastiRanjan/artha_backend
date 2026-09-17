import {
  PermissionConfigInterface,
  RolePayload,
} from './types';
import { DefaultRoutes, PublicRoutes, AuthenticatedDefaultRoutes } from './default-routes';
import { PermissionModules } from './modules';
import { RoleDefaults } from './role-defaults';

export const RolesCatalog: RolePayload[] = [
  {
    id: 'ed34dee5-9aa9-4434-a08f-369d82425a89',
    name: 'projectmanager',
    displayName: 'Project Manager',
    description: ''
  },
  {
    id: '3a8f7d5f-95c4-4a9e-af3e-39f5b72b3f6c',
    name: 'superuser',
    displayName: 'Super User',
    description: ''
  },
  {
    id: '7c9f6f7a-3a6a-46ea-8c1f-64c1e9f2f7f7',
    name: 'administrator',
    displayName: 'Administrator',
    description: ''
  },
  {
    id: 'c781eb6c-f4ec-41ed-861e-17d0ef1afa97',
    name: 'auditsenior',
    displayName: 'Audit Senior',
    description: ''
  },
  {
    id: '4ea78ec9-3cd1-45d1-a8ee-9f373b9315eb',
    name: 'auditjunior',
    displayName: 'Audit Junior',
    description: ''
  }
];

export const PermissionConfiguration: PermissionConfigInterface = {
  roles: RolesCatalog,
  defaultRoutes: DefaultRoutes,
  publicRoutes: PublicRoutes,
  authenticatedDefaultRoutes: AuthenticatedDefaultRoutes,
  modules: PermissionModules,
  roleDefaults: RoleDefaults,
  projectmanagerPermission: [],
  auditseniorPermission: [],
  administratorPermission: [],
  auditjuniorPermission: [],
};
