import { ModulesPayloadInterface, MethodList } from '../../config/permission-config';

export const legalStatusPermissions: ModulesPayloadInterface = {
  name: 'Legal Status Management',
  resource: 'legal-status',
  hasSubmodules: false,
  permissions: [
    {
      name: 'View all legal statuses',
      route: [
        {
          path: '/legal-status',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'Create legal status',
      route: [
        {
          path: '/legal-status',
          method: MethodList.POST
        }
      ]
    },
    {
      name: 'View legal status by id',
      route: [
        {
          path: '/legal-status/:id',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'Update legal status',
      route: [
        {
          path: '/legal-status/:id',
          method: MethodList.PATCH
        }
      ]
    },
    {
      name: 'Delete legal status',
      route: [
        {
          path: '/legal-status/:id',
          method: MethodList.DELETE
        }
      ]
    }
  ]
};
