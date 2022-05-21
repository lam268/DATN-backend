import { RequestAbsenceStatus } from '../../src/modules/request-absence/requestAbsence.constant';
import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';
import { TABLE_NAME } from '../constant';

export class RequestAbsence1632891593019 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: TABLE_NAME.RequestAbsences,
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
                        isNullable: false,
                    },
                    {
                        name: 'reason',
                        type: 'varchar',
                        length: '2000',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: Object.values(RequestAbsenceStatus),
                        isNullable: false,
                    },
                    {
                        name: 'startAt',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'endAt',
                        type: 'timestamp',
                        isNullable: true,
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
            TABLE_NAME.RequestAbsences,
            new TableIndex({
                name: 'IDX_USER_ID',
                columnNames: ['userId'],
            }),
        );

        await queryRunner.createForeignKey(
            TABLE_NAME.RequestAbsences,
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: TABLE_NAME.Users,
                referencedColumnNames: ['id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(TABLE_NAME.RequestAbsences, 'IDX_USER_ID');
        await queryRunner.dropTable(TABLE_NAME.RequestAbsences);
    }
}
