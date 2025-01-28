import { Factory } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { RoleEntity } from 'src/role/entities/role.entity';
import { PermissionConfiguration } from 'src/config/permission-config';
import { PermissionEntity } from 'src/permission/entities/permission.entity';

export default class CreateRoleSeed {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const roles = PermissionConfiguration.roles;
    const projectmanagerPermission =
      PermissionConfiguration.projectmanagerPermission;
    const auditseniorPermission = PermissionConfiguration.auditseniorPermission;
    const auditjuniorPermission = PermissionConfiguration.auditjuniorPermission;

    await connection
      .createQueryBuilder()
      .insert()
      .into(RoleEntity)
      .values(roles)
      .orIgnore()
      .execute();

    // Assign all permission to superUser
    const role = await connection
      .getRepository(RoleEntity)
      .createQueryBuilder('role')
      .where('role.name = :name', {
        name: 'superuser'
      })
      .getOne();

    // Assign all permission to projectManager
    const projectManager = await connection
      .getRepository(RoleEntity)
      .createQueryBuilder('role')
      .where('role.name = :name', {
        name: 'projectmanager'
      })
      .getOne();

    // Assign all permission to auditSenior
    const auditSenior = await connection
      .getRepository(RoleEntity)
      .createQueryBuilder('role')
      .where('role.name = :name', {
        name: 'auditsenior'
      })
      .getOne();

    // Assign all permission to auditJunior
    const auditJunior = await connection
      .getRepository(RoleEntity)
      .createQueryBuilder('role')
      .where('role.name = :name', {
        name: 'auditjunior'
      })
      .getOne();

    if (role) {
      role.permission = await connection
        .getRepository(PermissionEntity)
        .createQueryBuilder('permission')
        .getMany();

      await role.save();
    }

    if (projectManager) {
      const projectManagerPermissions = projectmanagerPermission.flatMap(
        (permission) => permission.permissions?.map((p) => p.name)
      );
      projectManager.permission = await connection
        .getRepository(PermissionEntity)
        .createQueryBuilder('permission')
        .where('permission.description IN (:...descriptions)', {
          descriptions: projectManagerPermissions
        })
        .getMany();

      await projectManager.save();
    }
    if (auditSenior) {
      const auditSeniorPermissions = auditseniorPermission.flatMap(
        (permission) => permission.permissions?.map((p) => p.name)
      );
      auditSenior.permission = await connection
        .getRepository(PermissionEntity)
        .createQueryBuilder('permission')
        .where('permission.description IN (:...descriptions)', {
          descriptions: auditSeniorPermissions
        })
        .getMany();

      await auditSenior.save();
    }

    if (auditJunior) {
      const auditJuniorPermissions = auditjuniorPermission.flatMap(
        (permission) => permission.permissions?.map((p) => p.name)
      );
      auditJunior.permission = await connection
        .getRepository(PermissionEntity)
        .createQueryBuilder('permission')
        .where('permission.description IN (:...descriptions)', {
          descriptions: auditJuniorPermissions
        })
        .getMany();

      await auditJunior.save();
    }
  }
}
