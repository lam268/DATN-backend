import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';
import { TABLE_NAME } from '../constant';

export class UserTimekeepingHistory1642991478024 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE_NAME.UserTimekeepingHistory,
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
            name: 'month',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'year',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'paidLeaveHoursLeft',
            type: 'decimal(5, 2)',
            isNullable: false,
            default: 0,
          },
          {
            name: 'paidLeaveHoursUsed',
            type: 'decimal(5, 2)',
            isNullable: false,
            default: 0,
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

    await queryRunner.createForeignKey(
      TABLE_NAME.UserTimekeepingHistory,
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: TABLE_NAME.Users,
        referencedColumnNames: ['id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      TABLE_NAME.UserTimekeepingHistory,
      'IDX_USER_ID',
    );
    await queryRunner.dropTable(TABLE_NAME.UserTimekeepingHistory);
  }
}
