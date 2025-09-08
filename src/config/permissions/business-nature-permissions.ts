import { MethodList } from '../permission-config';

export const businessNaturePermissions = {
  name: 'Business Nature Management',
  resource: 'business-nature',
  hasSubmodules: false,
  permissions: [
    {
      name: 'View all Business Natures',
      route: [
        { path: '/business-nature', method: MethodList.GET }
      ]
    },
    {
      name: 'View Business Nature by id',
      route: [
        { path: '/business-nature/:id', method: MethodList.GET }
      ]
    },
    {
      name: 'Create Business Nature',
      route: [
        { path: '/business-nature', method: MethodList.POST }
      ]
    },
    {
      name: 'Update Business Nature',
      route: [
        { path: '/business-nature/:id', method: MethodList.PATCH }
      ]
    },
    {
      name: 'Delete Business Nature',
      route: [
        { path: '/business-nature/:id', method: MethodList.DELETE }
      ]
    }
  ]
};
