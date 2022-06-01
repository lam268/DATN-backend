import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';
import { TABLE_NAME } from '../constant';

export class Timekeeping1632891593017 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: TABLE_NAME.Timekeeping,
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'userId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'checkIn',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'checkOut',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: true,
                    },
                    {
                        name: 'scanAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
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
            TABLE_NAME.Timekeeping,
            new TableIndex({
                name: 'IDX_USER_ID',
                columnNames: ['userId'],
            }),
        );

        await queryRunner.createForeignKey(
            TABLE_NAME.Timekeeping,
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: TABLE_NAME.Users,
                referencedColumnNames: ['id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(TABLE_NAME.Timekeeping, 'IDX_USER_ID');
        await queryRunner.dropTable(TABLE_NAME.Timekeeping);
    }
}
