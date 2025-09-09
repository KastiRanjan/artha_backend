import { MethodList } from './permission-config';

export const businessSizePermissions = {
  name: 'Business Size Management',
  resource: 'business-size',
  hasSubmodules: false,
  permissions: [
    {
      name: 'View all business sizes',
      route: [
        {
          path: '/business-size',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'Create business size',
      route: [
        {
          path: '/business-size',
          method: MethodList.POST
        }
      ]
    },
    {
      name: 'View business size by id',
      route: [
        {
          path: '/business-size/:id',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'Update business size',
      route: [
        {
          path: '/business-size/:id',
          method: MethodList.PATCH
        }
      ]
    },
    {
      name: 'Delete business size',
      route: [
        {
          path: '/business-size/:id',
          method: MethodList.DELETE
        }
      ]
    }
  ]
};

export const businessNaturePermissions = {
  name: 'Business Nature Management',
  resource: 'business-nature',
  hasSubmodules: false,
  permissions: [
    {
      name: 'View all business natures',
      route: [
        {
          path: '/business-nature',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'Create business nature',
      route: [
        {
          path: '/business-nature',
          method: MethodList.POST
        }
      ]
    },
    {
      name: 'View business nature by id',
      route: [
        {
          path: '/business-nature/:id',
          method: MethodList.GET
        }
      ]
    },
    {
      name: 'Update business nature',
      route: [
        {
          path: '/business-nature/:id',
          method: MethodList.PATCH
        }
      ]
    },
    {
      name: 'Delete business nature',
      route: [
        {
          path: '/business-nature/:id',
          method: MethodList.DELETE
        }
      ]
    }
  ]
};
