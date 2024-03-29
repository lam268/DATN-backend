import { MigrationInterface, QueryRunner } from 'typeorm';
import { TABLE_NAME } from '../constant';

export class SeedingRolePermission1639739063825 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`insert into ${TABLE_NAME.RolePermissions} (id, permissionId, roleId, createdBy) values
        (1, 1, 1, 1), (2, 2, 1, 1), (3, 3, 1, 1), (4, 4, 1, 1), (5, 5, 1, 1),
        (6, 6, 1, 1), (7, 7, 1, 1), (8, 8, 1, 1), (9, 9, 1, 1),
        (10, 10, 1, 1), (11, 11, 1, 1), (12, 12, 1, 1), (13, 13, 1, 1),
        (14, 14, 1, 1), (15, 15, 1, 1), (16, 16, 1, 1), (17, 17, 1, 1), (18, 18, 1, 1),
        (19, 19, 1, 1), (20, 20, 1, 1), (21, 21, 1, 1), (22, 22, 1, 1), (23, 23, 1, 1), 
        (24, 24, 1, 1), (25, 25, 1, 1), (26, 26, 1, 1), (27, 27, 1, 1),
        (28, 28, 1, 1), (29, 29, 1, 1), (30, 30, 1, 1), (31, 31, 1, 1);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager
            .getRepository(TABLE_NAME.RolePermissions)
            .delete({});
    }
}
