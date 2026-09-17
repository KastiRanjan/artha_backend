import { Factory } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { RoleEntity } from 'src/role/entities/role.entity';
import { PermissionConfiguration } from 'src/config/permission-config';
import { PermissionEntity } from 'src/permission/entities/permission.entity';

export default class CreateRoleSeed {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const roles = PermissionConfiguration.roles;
    const roleDefaults = PermissionConfiguration.roleDefaults || {};

    await connection
      .createQueryBuilder()
      .insert()
      .into(RoleEntity)
      .values(roles)
      .orIgnore()
      .execute();

    const allPermissions = await connection
      .getRepository(PermissionEntity)
      .find();

    for (const roleDef of roles) {
      const role = await connection
        .getRepository(RoleEntity)
        .findOne({ name: roleDef.name });

      if (!role) continue;

      const defaults = roleDefaults[roleDef.name];
      if (defaults === 'ALL') {
        role.permission = allPermissions;
        await role.save();
      } else if (Array.isArray(defaults) && defaults.length > 0) {
        const defaultSet = new Set(defaults.map((d: string) => d.toLowerCase().trim()));
        role.permission = allPermissions.filter((p) => {
          const desc = p.description?.toLowerCase().trim();
          return desc && defaultSet.has(desc);
        });
        await role.save();
      }
    }
  }
}
