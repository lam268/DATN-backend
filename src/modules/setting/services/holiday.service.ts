import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import moment from 'moment';
import {
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
} from 'src/common/constants';
import { Between, EntityManager, Not } from 'typeorm';
import { HolidayListQueryStringDto } from '../dto/request/holiday.dto';
import { SettingHoliday } from '../entity/setting-holiday.entity';
import { holidayListAttributes } from '../setting.constant';
import { IHolidayData } from '../setting.interface';
import { DEFAULT_LIMIT_FOR_HOLIDAY } from '../setting.constant';

@Injectable()
export class HolidayService {
    constructor(
        @InjectEntityManager()
        private readonly dbManager: EntityManager,
    ) {}

    async getHolidayById(id: number) {
        try {
            const holiday = await this.dbManager.findOne(
                SettingHoliday,
                { id },
                { select: holidayListAttributes as (keyof SettingHoliday)[] },
            );
            return holiday;
        } catch (error) {
            throw error;
        }
    }

    async checkIdExists(id: number): Promise<boolean> {
        try {
            const count = await this.dbManager.count(SettingHoliday, {
                where: { id },
                take: 1,
            });
            return count > 0;
        } catch (error) {
            throw error;
        }
    }

    async countHolidayByDate(date: string, id?: number) {
        const endDate = moment(date)
            .add(1, 'day')
            .subtract(1, 'second')
            .fmFullTimeString();
        try {
            const where = {
                date: Between(date, endDate),
            };
            if (id) {
                Object.assign(where, {
                    id: Not(id),
                });
            }
            return this.dbManager.count(SettingHoliday, { where });
        } catch (error) {
            throw error;
        }
    }

    async getHolidayList(query: HolidayListQueryStringDto) {
        try {
            const {
                startDate = null,
                endDate = null,
                orderBy = DEFAULT_ORDER_BY,
                orderDirection = DEFAULT_ORDER_DIRECTION,
            } = query;
            const [items, totalItems] = await this.dbManager
                .getRepository(SettingHoliday)
                .findAndCount({
                    where: (queryBuilder) => {
                        queryBuilder.andWhere({
                            date: Between(startDate, endDate),
                        });
                    },
                    order: {
                        [orderBy]: orderDirection.toUpperCase(),
                    },
                    select: holidayListAttributes as (keyof SettingHoliday)[],
                    take: DEFAULT_LIMIT_FOR_HOLIDAY,
                });
            return { items, totalItems };
        } catch (error) {
            throw error;
        }
    }

    async createHoliday(data: IHolidayData) {
        try {
            const insertedHoliday = await this.dbManager
                .getRepository(SettingHoliday)
                .insert(data);
            const holidayId = insertedHoliday.identifiers?.[0]?.id;
            if (holidayId) {
                const holidayDetail = await this.getHolidayById(holidayId);
                return holidayDetail;
            } else {
                throw new InternalServerErrorException();
            }
        } catch (error) {
            throw error;
        }
    }

    async updateHoliday(id: number, data: IHolidayData) {
        try {
            await this.dbManager.update(
                SettingHoliday,
                { id },
                {
                    ...data,
                },
            );

            return await this.getHolidayById(id);
        } catch (error) {
            throw error;
        }
    }
    async deleteHoliday(id: number, userId: number) {
        try {
            await this.dbManager.update(
                SettingHoliday,
                { id },
                {
                    deletedAt: new Date(),
                    deletedBy: userId,
                },
            );
        } catch (error) {
            throw error;
        }
    }
}
