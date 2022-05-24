import { ContractStatus } from '../../src/modules/contract/contract.constant';
import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';
import { TABLE_NAME } from '../constant';

export class Contract1639738518022 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: TABLE_NAME.Contracts,
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
                    },
                    {
                        name: 'contractTypeId',
                        type: 'int',
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: Object.values(ContractStatus),
                        isNullable: true,
                    },
                    {
                        name: 'startDate',
                        type: 'timestamp',
                    },
                    {
                        name: 'endDate',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'stopDate',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'url',
                        type: 'varchar',
                        length: '2500',
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
            TABLE_NAME.Contracts,
            new TableIndex({
                name: 'IDX_USER_ID',
                columnNames: ['userId'],
            }),
        );

        await queryRunner.createForeignKey(
            TABLE_NAME.Contracts,
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: TABLE_NAME.Users,
                referencedColumnNames: ['id'],
            }),
        );

        await queryRunner.createForeignKey(
            TABLE_NAME.Contracts,
            new TableForeignKey({
                columnNames: ['contractTypeId'],
                referencedTableName: TABLE_NAME.ContractTypes,
                referencedColumnNames: ['id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(TABLE_NAME.Contracts, 'IDX_USER_ID');
        await queryRunner.dropTable(TABLE_NAME.Contracts);
    }
}
