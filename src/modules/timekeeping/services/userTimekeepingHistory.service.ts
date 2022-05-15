import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, In } from 'typeorm';
import { UserTimekeepingHistory } from '../entity/user-timekeeping-history.entity';
import { userTimekeepingHistoryAttributes } from '../timekeeping.constant';
import { IGetUserTimekeepingListQueryStringDto } from '../dto/requests/get-user-timekeeping.dto';
import { IGetUserTimekeepingHistoryQueryString } from '../timekeeping.interface';

@Injectable()
export class UserTimekeepingHistoryService {
    constructor(
        @InjectEntityManager()
        private readonly dbManager: EntityManager,
    ) {}

    async getTimekeepingHistoryList(
        query: IGetUserTimekeepingListQueryStringDto,
    ) {
        const { userIds = [], month, year } = query;
        try {
            const [items, totalItems] = await this.dbManager.findAndCount(
                UserTimekeepingHistory,
                {
                    select: userTimekeepingHistoryAttributes,
                    where: (queryBuilder) => {
                        if (userIds?.length) {
                            queryBuilder.andWhere({
                                userId: In(userIds),
                            });
                        }
                        if (month) {
                            queryBuilder.andWhere({
                                month,
                            });
                        }
                        if (year) {
                            queryBuilder.andWhere({
                                year,
                            });
                        }
                    },
                },
            );
            return {
                items,
                totalItems,
            };
        } catch (error) {
            throw error;
        }
    }

    async getLatestTimekeepingHistory(
        query: IGetUserTimekeepingHistoryQueryString,
    ) {
        const { userId, month, year } = query;
        try {
            const userTimekeeingHistory = await this.dbManager.findOne(
                UserTimekeepingHistory,
                {
                    where: { userId, month, year },
                },
            );
            return userTimekeeingHistory;
        } catch (error) {
            throw error;
        }
    }
}
