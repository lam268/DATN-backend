import { TABLE_NAME } from '../constant';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedingPermissions1720963593398 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`insert into ${TABLE_NAME.Permissions} (id, actionId, resourceId, createdBy) values
        (1, 1, 1, 1), (2, 2, 1, 1), (3, 3, 1, 1), (4, 4, 1, 1), (5, 5, 1, 1),
        (6, 1, 2, 1), (7, 2, 2, 1), (8, 3, 2, 1), (9, 4, 2, 1),
        (10, 1, 3, 1), (11, 2, 3, 1), (12, 3, 3, 1), (13, 4, 3, 1),
        (14, 1, 4, 1), (15, 2, 4, 1), (16, 3, 4, 1), (17, 4, 4, 1), (18, 7, 4, 1),
        (19, 1, 5, 1), (20, 2, 5, 1), (21, 3, 5, 1), (22, 4, 5, 1), (23, 6, 5, 1), (24, 7, 5, 1), (25, 8, 5, 1), (26, 9, 5, 1), (27, 10, 5, 1),
        (28, 1, 6, 1), (29, 2, 6, 1), (30, 3, 6, 1), (31, 4, 6, 1);`);
    }

    public async down(queryRunner: QueryRunner) {
        const ids = [];
        for (let i = 1; i <= 60; i++) {
            ids.push(i);
        }
        await queryRunner.query(
            `delete from ${TABLE_NAME.Permissions} where id in (${ids.join(
                ',',
            )})`,
        );
    }
}
