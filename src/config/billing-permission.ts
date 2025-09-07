// Billing Management module to add to the modules array in permission-config.ts
export const billingManagementModule = {
  name: 'Billing Management',
  resource: 'billing',
  hasSubmodules: false,
  permissions: [
    {
      name: 'View all billings',
      route: [
        {
          path: '/billing',
          method: 'get'  // Use the actual MethodList.GET from your file
        }
      ]
    },
    {
      name: 'View billing by id',
      route: [
        {
          path: '/billing/:id',
          method: 'get'  // Use the actual MethodList.GET from your file
        }
      ]
    },
    {
      name: 'Store new billing',
      route: [
        {
          path: '/billing',
          method: 'post'  // Use the actual MethodList.POST from your file
        }
      ]
    },
    {
      name: 'Update billing by id',
      route: [
        {
          path: '/billing/:id',
          method: 'patch'  // Use the actual MethodList.PATCH from your file
        }
      ]
    },
    {
      name: 'Delete billing by id',
      route: [
        {
          path: '/billing/:id',
          method: 'delete'  // Use the actual MethodList.DELETE from your file
        }
      ]
    }
  ]
}

// Billing Management permission for audit roles to add to role permissions
export const billingManagementPermission = {
  name: 'Billing Management',
  resource: 'billing',
  hasSubmodules: false,
  permissions: [
    {
      name: 'View all billings',
      route: [
        {
          path: '/billing',
          method: 'get'
        }
      ]
    },
    {
      name: 'View billing by id',
      route: [
        {
          path: '/billing/:id',
          method: 'get'
        }
      ]
    },
    {
      name: 'Store new billing',
      route: [
        {
          path: '/billing',
          method: 'post'
        }
      ]
    },
    {
      name: 'Update billing by id',
      route: [
        {
          path: '/billing/:id',
          method: 'patch'
        }
      ]
    },
    {
      name: 'Delete billing by id',
      route: [
        {
          path: '/billing/:id',
          method: 'delete'
        }
      ]
    }
  ]
}
