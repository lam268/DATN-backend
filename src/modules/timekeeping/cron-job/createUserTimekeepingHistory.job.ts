import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
    DATE_TIME_FORMAT,
    TIMEZONE_NAME_DEFAULT,
    WORKING_HOUR_PER_DAY,
} from 'src/common/constants';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { EntityManager, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import moment from 'moment-timezone';
import * as dotenv from 'dotenv';
import { UserTimekeepingHistory } from '../entity/user-timekeeping-history.entity';
import forEach from 'lodash/forEach';
import { GeneralSettings } from 'src/modules/common/entity/general-settings.entity';
import { SettingKey } from 'src/modules/setting/setting.constant';
import {
    CREATE_USER_TIMEKEEPING_HISTORY_CRONJOB_BATCH_LIMIT,
    LastMonthOfTheYear,
    MODULE_NAME,
    timekeepingListAttributes,
    userDetailAttributes,
} from '../timekeeping.constant';
import {
    calculateActualWorkingHours,
    TimekeepingService,
} from '../services/timekeeping.service';
import {
    ITimekeeping,
    ITimekeepingGroupByDate,
    IUserTimekeepingHistory,
    UpdatePaidLeaveDaysData,
} from '../timekeeping.interface';
import { User } from 'src/modules/user/entity/user.entity';
import { RequestAbsence } from 'src/modules/request-absence/entity/request-absences.entity';
import { Contract } from 'src/modules/contract/entity/contract.entity';
import { ContractStatus } from 'src/modules/contract/contract.constant';
import { Timekeeping } from '../entity/timekeeping.entity';
import { ContractService } from 'src/modules/contract/services/contract.service';
import { RequestAbsenceService } from 'src/modules/request-absence/services/requestAbsence.service';
import { UserTimekeepingHistoryService } from '../services/userTimekeepingHistory.service';
dotenv.config();

const CRON_JOB_CREATING_USER_TIMEKEEPING_HISTORY =
    process.env.CRON_JOB_CREATING_USER_TIMEKEEPING_HISTORY || '0 0 * * *';

@Injectable()
export class CreateUserTimekeepingHistoryJob {
    constructor(
        private readonly configService: ConfigService,
        private readonly dbManager: EntityManager,
        private readonly contractService: ContractService,
        private readonly requestAbsenceSerivice: RequestAbsenceService,
        private readonly timekeepingService: TimekeepingService,
        private readonly userTimekeepingHistoryService: UserTimekeepingHistoryService,
    ) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `${MODULE_NAME}-create-user-timekeeping-history-job`,
        this.configService,
    );

    calculatePaidLeaveHoursUsed(userTimekeeping: ITimekeepingGroupByDate) {
        let totalAuthorizedLeaveHours = 0;
        forEach(userTimekeeping?.timekeepings, (timekeeping) => {
            // calculate the actual working time, authorized absence time
            const workingInfo = calculateActualWorkingHours(timekeeping);
            totalAuthorizedLeaveHours += workingInfo?.authorizedLeaveHours;
        });
        return totalAuthorizedLeaveHours;
    }

    calculateWorkingInfo(
        userTimekeeping: ITimekeepingGroupByDate,
    ): UpdatePaidLeaveDaysData {
        const lastMonth = moment()
            .tz(TIMEZONE_NAME_DEFAULT)
            .startOf('month')
            .utc()
            .subtract(1, 'month');
        let contractPaidLeaveHours = 0;
        if (
            moment(userTimekeeping?.contract?.startDate).isSameOrBefore(
                moment().tz(TIMEZONE_NAME_DEFAULT).startOf('month').utc(),
            )
        ) {
            contractPaidLeaveHours =
                +userTimekeeping?.contractType?.paidLeaveDays || 0;
        }
        const paidLeaveHours =
            (+userTimekeeping?.timekeepingHistory?.paidLeaveHoursLeft || 0) +
            contractPaidLeaveHours * WORKING_HOUR_PER_DAY;
        const paidLeaveHoursUsed = Math.min(
            this.calculatePaidLeaveHoursUsed(userTimekeeping),
            paidLeaveHours,
        );
        return {
            userId: userTimekeeping.userId,
            month: lastMonth.month() + 1,
            year: lastMonth.year(),
            paidLeaveHours:
                userTimekeeping?.contractType?.paidLeaveDays *
                    WORKING_HOUR_PER_DAY || 0,
            paidLeaveHoursUsed,
            paidLeaveHoursLeft: paidLeaveHours,
        };
    }

    async calculateNewTimekeepingHistory(
        userTimekeepingHistory: UpdatePaidLeaveDaysData,
        isResetPaidLeaveHoursDate: boolean,
    ): Promise<IUserTimekeepingHistory> {
        const lastMonth =
            moment().tz(TIMEZONE_NAME_DEFAULT).subtract(1, 'month').month() + 1;
        const yearOfLastMonth = moment()
            .tz(TIMEZONE_NAME_DEFAULT)
            .subtract(1, 'month')
            .year();

        let paidLeaveHoursToSubtract = 0;
        if (isResetPaidLeaveHoursDate) {
            const lastYear = moment()
                .tz(TIMEZONE_NAME_DEFAULT)
                .subtract(1, 'year')
                .year();
            const thisYear = moment().tz(TIMEZONE_NAME_DEFAULT).year();
            const recordFromLastYear = await this.dbManager.findOne(
                UserTimekeepingHistory,
                {
                    where: {
                        userId: userTimekeepingHistory.userId,
                        month: LastMonthOfTheYear,
                        year: lastYear,
                    },
                },
            );
            const paidLeaveHoursRemainingLastYear =
                recordFromLastYear?.paidLeaveHoursLeft || 0;
            const historiesThisYear = await this.dbManager.find(
                UserTimekeepingHistory,
                {
                    where: {
                        userId: userTimekeepingHistory.userId,
                        year: thisYear,
                    },
                },
            );

            const totalPaidLeaveHoursUsed =
                historiesThisYear.reduce((totalHours, history) => {
                    return totalHours + +history.paidLeaveHoursUsed;
                }, 0) + userTimekeepingHistory.paidLeaveHoursUsed;
            paidLeaveHoursToSubtract =
                paidLeaveHoursRemainingLastYear - totalPaidLeaveHoursUsed;
        }
        paidLeaveHoursToSubtract =
            Math.max(paidLeaveHoursToSubtract, 0) +
            userTimekeepingHistory.paidLeaveHoursUsed;
        const paidLeaveHoursLeft =
            userTimekeepingHistory?.paidLeaveHoursLeft -
            paidLeaveHoursToSubtract;

        return {
            ...userTimekeepingHistory,
            paidLeaveHoursLeft,
            year: yearOfLastMonth,
            month: lastMonth,
        };
    }

    async calculateTimekeepingHistory(
        timekeeping: ITimekeepingGroupByDate,
        isResetPaidLeaveHoursDate: boolean,
    ): Promise<IUserTimekeepingHistory> {
        const lastMonthWorkingInfo = this.calculateWorkingInfo(timekeeping);
        const lastMonthTimekeepingHistory =
            await this.calculateNewTimekeepingHistory(
                lastMonthWorkingInfo,
                isResetPaidLeaveHoursDate,
            );
        return lastMonthTimekeepingHistory;
    }

    // find all users who already created the timekeeping history for last month
    async getProcessedUserIds(): Promise<number[]> {
        const month =
            moment().tz(TIMEZONE_NAME_DEFAULT).subtract(1, 'month').month() + 1;
        const year = moment()
            .tz(TIMEZONE_NAME_DEFAULT)
            .subtract(1, 'month')
            .year();

        try {
            const historiesInsertedLastMonth = await this.dbManager
                .createQueryBuilder(
                    UserTimekeepingHistory,
                    'lastMonthUserTimekeepingHistory',
                )
                .where((queryBuilder) => {
                    queryBuilder.andWhere(
                        'lastMonthUserTimekeepingHistory.month = :month',
                        {
                            month,
                        },
                    );
                    queryBuilder.andWhere(
                        'lastMonthUserTimekeepingHistory.year = :year',
                        {
                            year,
                        },
                    );
                })
                .select('lastMonthUserTimekeepingHistory.userId')
                .getMany();
            return historiesInsertedLastMonth.map((history) => history.userId);
        } catch (error) {
            throw error;
        }
    }

    // find all users who have not created the timekeeping history for last month
    async getUnprocessedUserIds(excludedUserIds: number[]): Promise<User[]> {
        try {
            const users = await this.dbManager.find(User, {
                where: (queryBuilder) => {
                    if (excludedUserIds.length) {
                        queryBuilder.where('id NOT IN (:excludedUserIds)', {
                            excludedUserIds,
                        });
                    }
                },
                select: userDetailAttributes,
            });
            return users;
        } catch (error) {
            throw error;
        }
    }

    async getActiveContract(userId: number) {
        try {
            const contract = await this.dbManager.findOne(Contract, {
                where: {
                    userId,
                    status: ContractStatus.ACTIVE,
                },
                relations: ['contractType'],
            });
            return contract;
        } catch (error) {
            throw error;
        }
    }

    async getTimekeepings(userId: number) {
        try {
            const startOfLastMonth = moment()
                .tz(TIMEZONE_NAME_DEFAULT)
                .subtract(1, 'month')
                .startOf('month')
                .utc()
                .fmFullTimeString();
            const endOfLastMonth = moment()
                .tz(TIMEZONE_NAME_DEFAULT)
                .subtract(1, 'month')
                .endOf('month')
                .utc()
                .fmFullTimeString();
            const timekeepings = await this.dbManager.find(Timekeeping, {
                select: timekeepingListAttributes,
                where: (queryBuilder) => {
                    queryBuilder.andWhere({
                        userId,
                    });
                    queryBuilder.andWhere({
                        scanAt: MoreThanOrEqual(startOfLastMonth),
                    });
                    queryBuilder.andWhere({
                        scanAt: LessThanOrEqual(endOfLastMonth),
                    });
                },
            });

            return timekeepings.reduce(
                (timekeepingMappedToDate, timekeeping) => {
                    timekeepingMappedToDate[
                        moment(timekeeping.scanAt).fmDayString()
                    ] = {
                        ...timekeeping,
                        checkIn: timekeeping.checkIn
                            ? moment(timekeeping.checkIn)
                                  .tz(TIMEZONE_NAME_DEFAULT)
                                  .fmFullTimeString()
                            : null,
                        checkOut: timekeeping.checkOut
                            ? moment(timekeeping.checkOut)
                                  .tz(TIMEZONE_NAME_DEFAULT)
                                  .fmFullTimeString()
                            : null,
                        requestAbsences: [],
                        scanAt: moment(timekeeping.scanAt).fmDayString(),
                    };
                    return timekeepingMappedToDate;
                },
                {},
            );
        } catch (error) {
            throw error;
        }
    }

    parseUserData(
        userId: number,
        contract: Contract,
        timekeepings: Record<string, ITimekeeping>,
        requestAbsences: Record<string, RequestAbsence[]>,
        timekeepingHistory: UserTimekeepingHistory,
    ): ITimekeepingGroupByDate {
        const startOfLastMonth = moment()
            .tz(TIMEZONE_NAME_DEFAULT)
            .subtract(1, 'month')
            .startOf('month');
        const endOfLastMonth = moment()
            .tz(TIMEZONE_NAME_DEFAULT)
            .subtract(1, 'month')
            .endOf('month');
        const timeRange = endOfLastMonth.diff(startOfLastMonth, 'day');

        for (let index = 0; index <= timeRange; index++) {
            const scanAt = startOfLastMonth
                .clone()
                .add(index, 'day')
                .fmDayString();

            const currentDateRequestAbsences = requestAbsences?.[scanAt]?.length
                ? requestAbsences[scanAt]
                : [];

            if (!(scanAt in timekeepings)) {
                timekeepings[scanAt] = {
                    id: null,
                    checkIn: null,
                    checkOut: null,
                    scanAt,
                };
            }
            timekeepings[scanAt].requestAbsences = currentDateRequestAbsences;
        }

        return {
            userId,
            contract,
            contractType: contract?.contractType,
            timekeepings,
            timekeepingHistory,
        };
    }

    async isNeedToResetPaidLeaveDays() {
        const previousMonth = moment()
            .subtract(1, 'month')
            .tz(TIMEZONE_NAME_DEFAULT)
            .format(DATE_TIME_FORMAT.YYYY_MM_HYPHEN);

        const yearOfPreviousMonth = moment()
            .subtract(1, 'month')
            .tz(TIMEZONE_NAME_DEFAULT)
            .year();
        const schedule = await this.dbManager.findOne(GeneralSettings, {
            where: { key: SettingKey.PAID_LEAVE_DAYS_RESET_SCHEDULE },
        });

        if (schedule && schedule.values?.[yearOfPreviousMonth.toString()]) {
            if (
                schedule.values?.[yearOfPreviousMonth.toString()] ===
                previousMonth
            ) {
                return true;
            }
        }
        return false;
    }

    @Cron(CRON_JOB_CREATING_USER_TIMEKEEPING_HISTORY, {
        timeZone: TIMEZONE_NAME_DEFAULT,
    })
    async createUserTimekeepingHistoryJob() {
        try {
            // get users that have timekeeping history last month
            const processedUserIds = await this.getProcessedUserIds();
            // get users that don't have timekeeping history last month
            const [unprocessedUserIds, isResetPaidLeaveHoursDate] =
                await Promise.all([
                    this.getUnprocessedUserIds(processedUserIds),
                    this.isNeedToResetPaidLeaveDays(),
                ]);

            const startOfLastMonth = moment()
                .tz(TIMEZONE_NAME_DEFAULT)
                .subtract(1, 'month')
                .startOf('month')
                .utc()
                .fmFullTimeString();
            const endOfLastMonth = moment()
                .tz(TIMEZONE_NAME_DEFAULT)
                .subtract(1, 'month')
                .endOf('month')
                .utc()
                .fmFullTimeString();

            const lastTwoMonthMoment = moment()
                .tz(TIMEZONE_NAME_DEFAULT)
                .subtract(2, 'month');
            const monthOfLastTwoMonth = lastTwoMonthMoment.month() + 1;
            const yearOfLastTwoMonth = lastTwoMonthMoment.year();
            let processedCount = 0;
            while (processedCount < unprocessedUserIds.length) {
                const selectedUsers = unprocessedUserIds.slice(
                    processedCount,
                    processedCount +
                        Math.min(
                            CREATE_USER_TIMEKEEPING_HISTORY_CRONJOB_BATCH_LIMIT,
                            unprocessedUserIds.length - processedCount,
                        ),
                );
                const timekeepingHistories = await Promise.all(
                    selectedUsers.map(async (user) => {
                        const [
                            timekeepings,
                            activeContract,
                            requestAbsences,
                            latestTimekeepingHistory,
                        ] = await Promise.all([
                            this.timekeepingService.getTimekeepingsByUserId({
                                userId: user.id,
                                startDate: startOfLastMonth,
                                endDate: endOfLastMonth,
                            }),
                            this.contractService.getActiveContractByUserId(
                                user.id,
                            ),
                            this.requestAbsenceSerivice.getRequestAbsencesByUserId(
                                {
                                    userId: user.id,
                                    startDate: startOfLastMonth,
                                    endDate: endOfLastMonth,
                                },
                            ),
                            this.userTimekeepingHistoryService.getLatestTimekeepingHistory(
                                {
                                    userId: user.id,
                                    month: monthOfLastTwoMonth,
                                    year: yearOfLastTwoMonth,
                                },
                            ),
                        ]);

                        // group user timekeepings and request absences by date and combine with contract, timekeeping history data
                        const parsedUserData = this.parseUserData(
                            user.id,
                            activeContract,
                            timekeepings,
                            requestAbsences,
                            latestTimekeepingHistory,
                        );

                        return await this.calculateTimekeepingHistory(
                            parsedUserData,
                            isResetPaidLeaveHoursDate,
                        );
                    }),
                );

                await this.dbManager
                    .createQueryBuilder()
                    .insert()
                    .into(UserTimekeepingHistory)
                    .values(timekeepingHistories)
                    .execute();
                processedCount += selectedUsers.length;
            }
        } catch (error) {
            this.logger.error('Error in createUserTimekeepingHistory: ', error);
        }
    }
}
