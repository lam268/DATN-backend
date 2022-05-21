import { MigrationInterface, QueryRunner } from 'typeorm';
import * as dotenv from 'dotenv';
import { TABLE_NAME } from '../constant';
import { User } from 'src/modules/user/entity/user.entity';
dotenv.config();

export class BillingSeeder1724329509103 implements MigrationInterface {
    tableName = TABLE_NAME.Billings;
    needToSeed() {
        const { NEED_SEED_DATA } = process.env;
        return (
            NEED_SEED_DATA && NEED_SEED_DATA.split(',').includes(this.tableName)
        );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (this.needToSeed()) {
            const user = (await queryRunner.manager
                .getRepository('users')
                .findOne({ where: {} })) as User;
            await queryRunner.manager.getRepository(this.tableName).insert([
                {
                    name: 'Electric invoice',
                    description: 'Electric invoice month 11',
                    url: 'https://drive.google.com/file/d/1rBi1tqfsD5DH8qTEhoTmdzP772ZGmtgB/view?usp=sharing',
                    userId: user.id,
                    payDate: '2022-06-01',
                },
                {
                    name: 'Electric invoice',
                    description: 'Electric invoice month 12',
                    url: 'https://drive.google.com/file/d/1rBi1tqfsD5DH8qTEhoTmdzP772ZGmtgB/view?usp=sharing',
                    userId: user.id,
                    payDate: '2022-06-01',
                },
                {
                    name: 'Fruit invoice',
                    description: 'Fruit vinmart invoice month 11',
                    url: 'https://drive.google.com/file/d/1rBi1tqfsD5DH8qTEhoTmdzP772ZGmtgB/view?usp=sharing',
                    userId: user.id,
                    payDate: '2022-06-01',
                },
                {
                    name: 'Electric invoice',
                    description: 'Electric invoice month 1',
                    url: 'https://drive.google.com/file/d/1rBi1tqfsD5DH8qTEhoTmdzP772ZGmtgB/view?usp=sharing',
                    userId: user.id,
                    payDate: '2022-06-01',
                },
            ]);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (this.needToSeed()) {
            await queryRunner.manager.getRepository(this.tableName).delete({});
        }
    }
}
