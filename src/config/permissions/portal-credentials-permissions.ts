import { ModulesPayloadInterface, MethodList } from '../../config/permission-config';

export const portalCredentialsPermissions: ModulesPayloadInterface = {
  name: 'Portal Credentials Management',
  resource: 'portal-credentials',
  hasSubmodules: false,
  permissions: [
    {
      name: 'View all portal credentials',
      route: [
        {
          path: '/portal-credentials',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'View portal credentials by id',
      route: [
        {
          path: '/portal-credentials/:id',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'View portal credentials by customer',
      route: [
        {
          path: '/portal-credentials/customer/:id',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'Create portal credentials',
      route: [
        {
          path: '/portal-credentials',
          method: MethodList.POST
        }
      ]
    },
    {
      name: 'Update portal credentials',
      route: [
        {
          path: '/portal-credentials/:id',
          method: MethodList.PATCH
        }
      ]
    },
    {
      name: 'Delete portal credentials',
      route: [
        {
          path: '/portal-credentials/:id',
          method: MethodList.DELETE
        }
      ]
    }
  ]
};
