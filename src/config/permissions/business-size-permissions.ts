import { MethodList } from '../permission-config';

export const businessSizePermissions = {
  name: 'Business Size Management',
  resource: 'business-size',
  hasSubmodules: false,
  permissions: [
    {
      name: 'View all Business Sizes',
      route: [
        { path: '/business-size', method: MethodList.GET }
      ]
    },
    {
      name: 'View Business Size by id',
      route: [
        { path: '/business-size/:id', method: MethodList.GET }
      ]
    },
    {
      name: 'Create Business Size',
      route: [
        { path: '/business-size', method: MethodList.POST }
      ]
    },
    {
      name: 'Update Business Size',
      route: [
        { path: '/business-size/:id', method: MethodList.PATCH }
      ]
    },
    {
      name: 'Delete Business Size',
      route: [
        { path: '/business-size/:id', method: MethodList.DELETE }
      ]
    }
  ]
};
