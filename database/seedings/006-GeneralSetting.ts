import { MigrationInterface, QueryRunner } from 'typeorm';
import * as dotenv from 'dotenv';
import { TABLE_NAME } from '../constant';
import { SettingKey } from '../../src/modules/setting/setting.constant';
dotenv.config();

export class UserGeneralSetting1724329509104 implements MigrationInterface {
    name?: string;
    tableName = TABLE_NAME.GeneralSettings;
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.getRepository(this.tableName).insert([
            {
                key: SettingKey.USER_POSITION,
                values: [
                    {
                        code: 'CEO',
                        value: {
                            en: 'CEO',
                            vi: 'Giám đốc điều hành',
                        },
                    },
                    {
                        code: 'CTO',
                        value: {
                            en: 'CTO',
                            vi: 'Giám đốc kỹ thuật',
                        },
                    },
                    {
                        code: 'COO',
                        value: {
                            en: 'COO',
                            vi: 'Phó giám đốc điều hành',
                        },
                    },
                    {
                        code: 'QA',
                        value: {
                            en: 'QA',
                            vi: 'QA',
                        },
                    },
                    {
                        code: 'TESTER',
                        value: {
                            en: 'Tester',
                            vi: 'Kiểm thử',
                        },
                    },
                    {
                        code: 'PROJECT_MANAGER',
                        value: {
                            en: 'Project manager',
                            vi: 'Trưởng dự án',
                        },
                    },
                    {
                        code: 'HUMAN_RESOURCE',
                        value: {
                            en: 'Human resources',
                            vi: 'Nhân sự',
                        },
                    },
                ],
            },
            {
                key: SettingKey.APPLIED_POSITION,
                values: [
                    {
                        code: 'Developer',
                        value: {
                            en: 'Developer',
                            vi: 'Lập trình viên',
                        },
                    },
                    {
                        code: 'CTO',
                        value: {
                            en: 'CTO',
                            vi: 'Giám đốc kỹ thuật',
                        },
                    },
                    {
                        code: 'COO',
                        value: {
                            en: 'COO',
                            vi: 'Phó giám đốc điều hành',
                        },
                    },
                    {
                        code: 'QA',
                        value: {
                            en: 'QA',
                            vi: 'QA',
                        },
                    },
                    {
                        code: 'TESTER',
                        value: {
                            en: 'Tester',
                            vi: 'Kiểm thử',
                        },
                    },
                    {
                        code: 'PROJECT_MANAGER',
                        value: {
                            en: 'Project manager',
                            vi: 'Trưởng dự án',
                        },
                    },
                    {
                        code: 'HUMAN_RESOURCE',
                        value: {
                            en: 'Human resources',
                            vi: 'Nhân sự',
                        },
                    },
                ],
            },
            {
                key: SettingKey.ASSET_CATEGORY,
                values: [
                    {
                        code: 'ELECTRONIC',
                        value: {
                            en: 'Electronic',
                            vi: 'Đồ điện tử',
                        },
                    },
                    {
                        code: 'FURNITURE',
                        value: {
                            en: 'Furniture',
                            vi: 'Đồ nội thất',
                        },
                    },
                    {
                        code: 'OTHER',
                        value: {
                            en: 'Other',
                            vi: 'Khác',
                        },
                    },
                ],
            },
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.getRepository(this.tableName).delete({});
    }
}
