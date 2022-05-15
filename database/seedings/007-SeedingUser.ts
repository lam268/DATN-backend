import { UserRole } from '../../src/modules/user/user.constant';
import { UserStatus } from '../../src/modules/user/user.constant';
import { In, MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { TABLE_NAME } from '../constant';
import { Role } from 'src/modules/role/entity/role.entity';
dotenv.config();
export class SeedingUser1720963593400 implements MigrationInterface {
  tableName = TABLE_NAME.Users;
  needToSeed() {
    const { NEED_SEED_DATA } = process.env;
    return NEED_SEED_DATA && NEED_SEED_DATA.split(',').includes(this.tableName);
  }
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (this.needToSeed()) {
      const role = (await queryRunner.manager
        .getRepository('roles')
        .findOne({ where: { name: UserRole.SUPERVISOR } })) as Role;
      const userDefault = {
        fullName: 'Admin',
        email: 'admin@admin',
        password: bcrypt.hashSync('ttlab@1234', bcrypt.genSaltSync(10)),
        status: UserStatus.ACTIVE,
        roleId: role.id,
        position: 'CEO',
      };
      const items = [
        {
          ...userDefault,
          id: 1,
          fullName: 'Admin',
          email: 'admin@admin.com',
        },
        {
          ...userDefault,
          id: 2,
          fullName: 'Le Vu Lam',
          email: 'lamlevu26@gmail.com',
        },
      ];

      await queryRunner.manager.getRepository(this.tableName).insert(items);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (this.needToSeed()) {
      await queryRunner.manager.getRepository(this.tableName).delete({});
    }
  }
}
