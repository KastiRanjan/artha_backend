import { superuserDefaults } from './superuser.defaults';
import { administratorDefaults } from './administrator.defaults';
import { projectmanagerDefaults } from './projectmanager.defaults';
import { auditseniorDefaults } from './auditsenior.defaults';
import { auditjuniorDefaults } from './auditjunior.defaults';

export const RoleDefaults: Record<string, string[] | 'ALL'> = {
  superuser: superuserDefaults,
  administrator: administratorDefaults,
  projectmanager: projectmanagerDefaults,
  auditsenior: auditseniorDefaults,
  auditjunior: auditjuniorDefaults,
};

export {
  superuserDefaults,
  administratorDefaults,
  projectmanagerDefaults,
  auditseniorDefaults,
  auditjuniorDefaults,
};
