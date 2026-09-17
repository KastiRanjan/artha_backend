import { MethodList, ModulesPayloadInterface } from '../types';

export const todoTaskModulePermissions: ModulesPayloadInterface[] = [
  {
    name: "Todo Task Title Management",
    resource: "todo-task-title",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all todo task titles",
        route: [
          {
            path: "/todo-task-title",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Create todo task title",
        route: [
          {
            path: "/todo-task-title",
            method: MethodList.POST
          }
        ]
      },
      {
        name: "View todo task title by id",
        route: [
          {
            path: "/todo-task-title/:id",
            method: MethodList.GET
          }
        ]
      },
      {
        name: "Update todo task title",
        route: [
          {
            path: "/todo-task-title/:id",
            method: MethodList.PATCH
          }
        ]
      },
      {
        name: "Delete todo task title",
        route: [
          {
            path: "/todo-task-title/:id",
            method: MethodList.DELETE
          }
        ]
      }
    ]
  },
  {
    name: "Todo Task Management",
    resource: "todo-task",
    hasSubmodules: false,
    permissions: [
      {
        name: "View all todo tasks",
        route: [
          {
            path: "/todo-task",
            method: MethodList.GET,
            resource: "todo-task",
            description: "View all todo tasks"
          }
        ]
      },
      {
        name: "View todo tasks by status",
        route: [
          {
            path: "/todo-task/status/:status",
            method: MethodList.GET,
            resource: "todo-task",
            description: "View todo tasks by status"
          }
        ]
      },
      {
        name: "View todo tasks assigned to user",
        route: [
          {
            path: "/todo-task/assigned/:userId",
            method: MethodList.GET,
            resource: "todo-task",
            description: "View todo tasks assigned to a specific user"
          }
        ]
      },
      {
        name: "View todo tasks created by user",
        route: [
          {
            path: "/todo-task/created/:userId",
            method: MethodList.GET,
            resource: "todo-task",
            description: "View todo tasks created by a specific user"
          }
        ]
      },
      {
        name: "View informed todo tasks",
        route: [
          {
            path: "/todo-task/informed",
            method: MethodList.GET,
            resource: "todo-task",
            description: "View todo tasks where the user is informed"
          }
        ]
      },
      {
        name: "View todo task by id",
        route: [
          {
            path: "/todo-task/:id",
            method: MethodList.GET,
            resource: "todo-task",
            description: "View a specific todo task by ID"
          }
        ]
      },
      {
        name: "Create todo task",
        route: [
          {
            path: "/todo-task",
            method: MethodList.POST,
            resource: "todo-task",
            description: "Create a new todo task"
          }
        ]
      },
      {
        name: "Update todo task",
        route: [
          {
            path: "/todo-task/:id",
            method: MethodList.PATCH,
            resource: "todo-task",
            description: "Update a todo task"
          }
        ]
      },
      {
        name: "Acknowledge todo task",
        route: [
          {
            path: "/todo-task/:id/acknowledge",
            method: MethodList.PATCH,
            resource: "todo-task",
            description: "Acknowledge a todo task"
          }
        ]
      },
      {
        name: "Mark todo task as pending",
        route: [
          {
            path: "/todo-task/:id/pending",
            method: MethodList.PATCH,
            resource: "todo-task",
            description: "Mark a todo task as pending"
          }
        ]
      },
      {
        name: "Complete todo task",
        route: [
          {
            path: "/todo-task/:id/complete",
            method: MethodList.PATCH,
            resource: "todo-task",
            description: "Complete a todo task"
          }
        ]
      },
      {
        name: "Drop todo task",
        route: [
          {
            path: "/todo-task/:id/drop",
            method: MethodList.PATCH,
            resource: "todo-task",
            description: "Drop a todo task"
          }
        ]
      },
      {
        name: "Delete todo task",
        route: [
          {
            path: "/todo-task/:id",
            method: MethodList.DELETE,
            resource: "todo-task",
            description: "Delete a todo task"
          }
        ]
      }
    ]
  }
];
