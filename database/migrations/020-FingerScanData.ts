import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';
import { TABLE_NAME } from '../constant';

export class FingerScanData1632891593020 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: TABLE_NAME.FingerScan,
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'username',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'scanAt',
                        type: 'timestamp',
                    },
                    {
                        name: 'userId',
                        type: 'int',
                    },
                    {
                        name: 'fingerId',
                        type: 'int',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'deletedAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'createdBy',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'updatedBy',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'deletedBy',
                        type: 'int',
                        isNullable: true,
                    },
                ],
            }),
        );
        await queryRunner.createIndex(
            TABLE_NAME.FingerScan,
            new TableIndex({
                name: 'IDX_USER_NAME',
                columnNames: ['username'],
            }),
        );
        await queryRunner.createIndex(
            TABLE_NAME.FingerScan,
            new TableIndex({
                name: 'IDX_USER_ID',
                columnNames: ['userId'],
            }),
        );
        await queryRunner.createIndex(
            TABLE_NAME.FingerScan,
            new TableIndex({
                name: 'IDX_FINGER_ID',
                columnNames: ['fingerId'],
            }),
        );

        await queryRunner.createForeignKey(
            TABLE_NAME.FingerScan,
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: TABLE_NAME.Users,
                referencedColumnNames: ['id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(TABLE_NAME.FingerScan, 'IDX_USER_NAME');
        await queryRunner.dropIndex(TABLE_NAME.FingerScan, 'IDX_USER_ID');
        await queryRunner.dropIndex(TABLE_NAME.FingerScan, 'IDX_FINGER_ID');
        await queryRunner.dropTable(TABLE_NAME.FingerScan);
    }
}
