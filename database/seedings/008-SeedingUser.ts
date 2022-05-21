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
        return (
            NEED_SEED_DATA && NEED_SEED_DATA.split(',').includes(this.tableName)
        );
    }
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (this.needToSeed()) {
            const role = (await queryRunner.manager
                .getRepository('roles')
                .findOne({ where: { name: UserRole.SUPERVISOR } })) as Role;
            const userDefault = {
                fullName: 'TTLab Admin',
                email: 'tims@tokyotechlab.com',
                password: bcrypt.hashSync('ttlab@1234', bcrypt.genSaltSync(10)),
                status: UserStatus.ACTIVE,
                roleId: role.id,
                position: 'CEO',
            };
            const items = [
                {
                    ...userDefault,
                    id: 1,
                    fullName: 'TTLab Admin',
                    email: 'tims@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 90,
                    fullName: 'TTLab Admin',
                    email: 'ledth@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    fullName: 'trungvt',
                    email: 'trungvt@tokyotechlab.com',
                    id: 4,
                },
                {
                    ...userDefault,
                    id: 3,
                    fullName: 'ledth',
                    email: 'ledth@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 11,
                    fullName: 'tuy nv',
                    email: 'tuynv@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 112,
                    fullName: 'hant',
                    email: 'hant@tokyotechlab.com',
                },

                {
                    ...userDefault,
                    id: 12,
                    fullName: 'tuannt',
                    email: 'tuannt@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 105,
                    fullName: 'tuantq',
                    email: 'tuantq@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 5,
                    fullName: 'tungtv',
                    email: 'tungtv@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 2,
                    fullName: 'tungns',
                    email: 'tungns@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 7,
                    fullName: 'lylt',
                    email: 'lylt@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 6,
                    fullName: 'phucpt',
                    email: 'phucpt@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 9,
                    fullName: 'linhnt',
                    email: 'linhnt@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 8,
                    fullName: 'thanhps',
                    email: 'thanhps@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 14,
                    fullName: 'nhidt',
                    email: 'nhidt@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 15,
                    fullName: 'hungnb',
                    email: 'hungnb@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 18,
                    fullName: 'thainh',
                    email: 'thainh@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 20,
                    fullName: 'landtk',
                    email: 'landtk@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 16,
                    fullName: 'huynq',
                    email: 'huynq@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 17,
                    fullName: 'chienlv',
                    email: 'chienlv@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 103,
                    fullName: 'hainm',
                    email: 'hainm@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 21,
                    fullName: 'ngocvk',
                    email: 'ngocvk@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 108,
                    fullName: 'huongkt',
                    email: 'huongkt@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 107,
                    fullName: 'anhnt',
                    email: 'anhnt@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 110,
                    fullName: 'lamlv',
                    email: 'lamlv@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 106,
                    fullName: 'khoacdd',
                    email: 'khoacdd@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 111,
                    fullName: 'hieuvt',
                    email: 'hieuvt@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 13,
                    fullName: 'thuanlv',
                    email: 'thuanlv@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 109,
                    fullName: 'duyenmt',
                    email: 'duyenmt@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 102,
                    fullName: 'trungtd',
                    email: 'trungtd@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 114,
                    fullName: 'phucnq',
                    email: 'phucnq@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 113,
                    fullName: 'trungpq',
                    email: 'trungpq@tokyotechlab.com',
                },
                {
                    ...userDefault,
                    id: 115,
                    fullName: 'truong vd',
                    email: 'truongvd@tokyotechlab.com',
                },
            ];

            await queryRunner.manager
                .getRepository(this.tableName)
                .insert(items);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (this.needToSeed()) {
            await queryRunner.manager.getRepository(this.tableName).delete({
                email: In(['tims@tokyotechlab.com', 'ledth@tokyotechlab.com']),
            });
        }
    }
}
