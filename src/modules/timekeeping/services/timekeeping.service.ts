import {
    forwardRef,
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_PAGINATION,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    MINUTES_PER_HOUR,
    ORDER_DIRECTION,
    TIMEZONE_NAME_DEFAULT,
    TYPE_ORM_ORDER_DIRECTION,
    workingTimes,
    WORKING_HOUR_PER_DAY,
} from 'src/common/constants';
import {
    Brackets,
    EntityManager,
    MoreThanOrEqual,
    LessThanOrEqual,
} from 'typeorm';
import moment from '~plugins/moment';
import { TimekeepingListQueryStringDto } from '../dto/requests/get-time-line-request.dto';
import {
    timekeepingAttributes,
    timekeepingListAttributes,
    TimekeepingOrderBy,
    userTimekeepingAttributes,
} from '../timekeeping.constant';
import { UserService } from '../../user/services/user.service';
import { TimekeepingDto } from '../dto/requests/create-time-line.dto';
import { User } from 'src/modules/user/entity/user.entity';
import { Timekeeping } from '../entity/timekeeping.entity';
import { RequestAbsence } from 'src/modules/request-absence/entity/request-absences.entity';
import { UserTimekeepingHistory } from 'src/modules/timekeeping/entity/user-timekeeping-history.entity';
import { File } from 'src/modules/file/entity/file.entity';
import {
    IGetTimekeepingsByUserIdQueryString,
    ITimekeeping,
} from '../timekeeping.interface';
import { RequestAbsenceService } from 'src/modules/request-absence/services/requestAbsence.service';
import { UserTimekeepingHistoryService } from './userTimekeepingHistory.service';
import { makeFileUrl } from 'src/common/helpers/common.function';
import { Moment } from 'moment';
import { ContractService } from 'src/modules/contract/services/contract.service';
import { Contract } from 'src/modules/contract/entity/contract.entity';

@Injectable()
export class TimekeepingService {
    constructor(
        @InjectEntityManager()
        @Inject(forwardRef(() => UserService))
        private readonly dbManager: EntityManager,
        private readonly requestAbsenceService: RequestAbsenceService,
        private readonly contractService: ContractService,
        private readonly userTimekeepingHistoryService: UserTimekeepingHistoryService,
    ) {}

    async getWorkingData(query: TimekeepingListQueryStringDto) {
        try {
            const startOfThisMonth = moment().startOfMonthString();
            const endOfThisMonth = moment().endOfMonthString();
            const {
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                page = DEFAULT_FIRST_PAGE,
                startDate = startOfThisMonth,
                endDate = endOfThisMonth,
                keyword = '',
                orderBy = DEFAULT_ORDER_BY,
                orderDirection = DEFAULT_ORDER_DIRECTION,
                userIds = [],
                statuses = [],
            } = query;

            const lastMonth =
                moment(startDate)
                    .tz(TIMEZONE_NAME_DEFAULT)
                    .subtract(1, 'month')
                    .month() + 1;
            const yearOfLastMonth = moment(startDate)
                .tz(TIMEZONE_NAME_DEFAULT)
                .subtract(1, 'month')
                .year();

            const order =
                orderBy === TimekeepingOrderBy.FULL_NAME
                    ? `user.${TimekeepingOrderBy.FULL_NAME}`
                    : `user.id`;

            // get user and contract type
            const _queryBuilder = this.dbManager
                .createQueryBuilder(User, 'user')
                .leftJoinAndMapOne(
                    'user.avatar',
                    File,
                    'file',
                    'file.id = user.avatarId',
                )
                .select(userTimekeepingAttributes)
                .where((queryBuilder) => {
                    if (userIds.length) {
                        queryBuilder.andWhere(
                            new Brackets((qb) => {
                                qb.where('user.id IN (:userIds)', {
                                    userIds,
                                });
                            }),
                        );
                    }
                    if (statuses.length) {
                        queryBuilder.andWhere(
                            new Brackets((qb) => {
                                qb.where('user.status IN(:statuses)', {
                                    statuses: statuses,
                                });
                            }),
                        );
                    }
                    if (keyword) {
                        const likeKeyword = `%${keyword}%`;
                        queryBuilder.andWhere(
                            new Brackets((qb) => {
                                qb.where('user.id LIKE :keyword', {
                                    keyword: likeKeyword,
                                })
                                    .orWhere('user.fullName LIKE :keyword', {
                                        keyword: likeKeyword,
                                    })
                                    .orWhere('user.email LIKE :keyword', {
                                        keyword: likeKeyword,
                                    });
                            }),
                        );
                    }
                })
                .orderBy(
                    order,
                    orderDirection.toUpperCase() as TYPE_ORM_ORDER_DIRECTION,
                );

            if (limit && page)
                _queryBuilder.take(limit).skip((page - 1) * limit);
            const [users, usersCount] = await _queryBuilder.getManyAndCount();
            const timekeepingResult = await Promise.all(
                users.map(async (user) => {
                    const [
                        timekeepings,
                        activeContract,
                        requestAbsences,
                        latestTimekeepingHistory,
                    ] = await Promise.all([
                        this.getTimekeepingsByUserId({
                            startDate,
                            endDate,
                            userId: user.id,
                        }),
                        this.contractService.getActiveContractByUserId(user.id),
                        this.requestAbsenceService.getRequestAbsencesByUserId({
                            startDate,
                            endDate,
                            userId: user.id,
                        }),
                        this.userTimekeepingHistoryService.getLatestTimekeepingHistory(
                            {
                                month: lastMonth,
                                year: yearOfLastMonth,
                                userId: user.id,
                            },
                        ),
                    ]);

                    return parseUserData(
                        user,
                        activeContract,
                        timekeepings,
                        requestAbsences,
                        latestTimekeepingHistory,
                        startDate,
                        endDate,
                    );
                }),
            );

            return {
                items: timekeepingResult,
                totalItems: usersCount,
            };
        } catch (error) {
            throw error;
        }
    }

    async createTimekeeping(timekeeping: TimekeepingDto) {
        try {
            const insertedTimekeeping = await this.dbManager
                .getRepository(Timekeeping)
                .insert(timekeeping);

            const timekeepingId = insertedTimekeeping?.identifiers[0]?.id;
            if (timekeepingId) {
                const timekeepingDetail = await this.getTimekeepingById(
                    timekeepingId,
                );
                return timekeepingDetail;
            }
            throw new InternalServerErrorException();
        } catch (error) {
            throw error;
        }
    }

    async getTimekeepingById(id: number) {
        try {
            const timekeeping = await this.dbManager.findOne(
                Timekeeping,
                { id },
                { select: timekeepingAttributes as (keyof Timekeeping)[] },
            );
            return timekeeping;
        } catch (error) {
            throw error;
        }
    }

    async updateTimekeeping(id: number, timekeeping: TimekeepingDto) {
        try {
            await this.dbManager
                .getRepository(Timekeeping)
                .update({ id }, timekeeping);
            const updatedTimekeeping = await this.getTimekeepingById(id);
            return updatedTimekeeping;
        } catch (error) {
            throw error;
        }
    }

    async checkIdExists(id: number): Promise<boolean> {
        try {
            const count = await this.dbManager.count(Timekeeping, {
                where: { id },
                take: 1,
            });
            return count > 0;
        } catch (error) {
            throw error;
        }
    }

    async deleteTimekeeping(id: number, userId: number) {
        try {
            await this.dbManager.update(
                Timekeeping,
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

    async getTimekeepingsByUserId(query: IGetTimekeepingsByUserIdQueryString) {
        try {
            const { userId, startDate, endDate } = query;
            const timekeepings = await this.dbManager.find(Timekeeping, {
                select: timekeepingListAttributes,
                where: (queryBuilder) => {
                    queryBuilder.andWhere({
                        userId,
                    });
                    queryBuilder.andWhere({
                        scanAt: MoreThanOrEqual(startDate),
                    });
                    queryBuilder.andWhere({
                        scanAt: LessThanOrEqual(endDate),
                    });
                },
            });
            return timekeepings.reduce(
                (timekeepingMappedToDate, timekeeping) => {
                    timekeepingMappedToDate[
                        moment(timekeeping.scanAt)
                            .tz(TIMEZONE_NAME_DEFAULT)
                            .fmDayString()
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
                        scanAt: moment(timekeeping.scanAt)
                            .tz(TIMEZONE_NAME_DEFAULT)
                            .fmDayString(),
                    };
                    return timekeepingMappedToDate;
                },
                {},
            );
        } catch (error) {
            throw error;
        }
    }

    async getUnprocessedDates(): Promise<string[]> {
        try {
            const timekeeping = await this.dbManager.find(Timekeeping, {
                take: 1,
                order: {
                    [TimekeepingOrderBy.DATE_SCAN]:
                        ORDER_DIRECTION.DESC.toLocaleUpperCase() as TYPE_ORM_ORDER_DIRECTION,
                },
                select: ['scanAt'],
            });
            const latestProcessedDate =
                timekeeping?.[0]?.scanAt || process.env.DEPLOYED_DATE;
            const diff = moment().diff(moment(latestProcessedDate), 'day');
            const unprocessedDates = [];
            for (let i = 1; i < diff; ++i) {
                unprocessedDates.push(
                    moment()
                        .tz(TIMEZONE_NAME_DEFAULT)
                        .subtract(i, 'day')
                        .fmDayString(),
                );
            }
            return unprocessedDates;
        } catch (error) {
            throw error;
        }
    }
}

export function calculateAbsenceTime(
    timekeeping: ITimekeeping,
    timeEndMorningMoment: Moment,
    timeStartAfternoonMoment: Moment,
) {
    let leaveMinutesInWork = 0;
    let leaveMinutesAllDay = 0;
    timekeeping.requestAbsences.forEach((requestAbsence) => {
        let startAt = moment(requestAbsence.startAt);
        let endAt = moment(requestAbsence.endAt);

        if (
            moment(startAt).isBetween(
                timeEndMorningMoment,
                timeStartAfternoonMoment,
            )
        ) {
            startAt = timeStartAfternoonMoment;
        }
        if (
            moment(endAt).isBetween(
                timeEndMorningMoment,
                timeStartAfternoonMoment,
            )
        ) {
            endAt = timeEndMorningMoment;
        }

        let absenceTime = 0;
        if (
            startAt.diff(timeEndMorningMoment) <= 0 &&
            endAt.diff(timeStartAfternoonMoment) >= 0
        ) {
            absenceTime = endAt.diff(startAt, 'minutes') - MINUTES_PER_HOUR;
        } else {
            absenceTime = Math.max(0, endAt.diff(startAt, 'minutes'));
        }
        leaveMinutesAllDay += absenceTime;
        if (
            timekeeping.checkIn &&
            timekeeping.checkOut &&
            startAt.isBetween(timekeeping.checkIn, timekeeping.checkOut) &&
            endAt.isBetween(timekeeping.checkIn, timekeeping.checkOut)
        ) {
            leaveMinutesInWork += absenceTime;
        }
    });

    return {
        leaveMinutesAllDay,
        leaveMinutesInWork,
    };
}

export function calculateActualWorkingHours(timekeeping: ITimekeeping) {
    const convertedWorkingTimes = {
        morning: {
            startTime: moment(timekeeping.scanAt)
                .set('hour', workingTimes.morning.startHour)
                .set('minute', workingTimes.morning.startMinute)
                .set('second', 0),
            endTime: moment(timekeeping.scanAt)
                .set('hour', workingTimes.morning.endHour)
                .set('minute', workingTimes.morning.endMinute)
                .set('second', 0),
        },
        afternoon: {
            startTime: moment(timekeeping.scanAt)
                .set('hour', workingTimes.afternoon.startHour)
                .set('minute', workingTimes.afternoon.startMinute)
                .set('second', 0),
            endTime: moment(timekeeping.scanAt)
                .set('hour', workingTimes.afternoon.endHour)
                .set('minute', workingTimes.afternoon.endMinute)
                .set('second', 0),
        },
    };
    const timeEndMorningMoment = convertedWorkingTimes.morning.endTime;
    const timeStartAfternoonMoment = convertedWorkingTimes.afternoon.startTime;

    timekeeping.requestAbsences.forEach((requestAbsence) => {
        if (
            timekeeping.checkIn &&
            moment(timekeeping.checkIn).isBetween(
                moment(requestAbsence.startAt),
                moment(requestAbsence.endAt),
            )
        ) {
            // if user checkin before absence start then move it to when absence end
            timekeeping.checkIn = requestAbsence.endAt as string;
        }
        if (
            timekeeping.checkOut &&
            moment(timekeeping.checkOut).isBetween(
                moment(requestAbsence.startAt),
                moment(requestAbsence.endAt),
            )
        ) {
            // if user checkout after absence start then move it to when absence start
            timekeeping.checkOut = requestAbsence.startAt as string;
        }
    });

    const { leaveMinutesInWork, leaveMinutesAllDay } = calculateAbsenceTime(
        timekeeping,
        timeEndMorningMoment,
        timeStartAfternoonMoment,
    );

    // if user does not checkout then workingHours = 0
    if (!timekeeping.checkOut) {
        return {
            workingHours: 0,
            authorizedLeaveHours: leaveMinutesAllDay / MINUTES_PER_HOUR,
            unauthorizedLeaveHours:
                WORKING_HOUR_PER_DAY - leaveMinutesAllDay / MINUTES_PER_HOUR,
        };
    }
    let checkInAt = moment(timekeeping.checkIn);
    let checkOutAt = moment(timekeeping.checkOut);

    if (checkInAt.isBefore(convertedWorkingTimes.morning.startTime)) {
        // user checkin before start of morning working time then set it to start of morning working time
        checkInAt = convertedWorkingTimes.morning.startTime;
    } else if (
        moment(checkInAt).isBetween(
            timeEndMorningMoment,
            timeStartAfternoonMoment,
        )
    ) {
        // if user checkin at the rest time then set it to start of afternoon working time
        checkInAt = timeStartAfternoonMoment;
    }

    if (checkOutAt.isAfter(convertedWorkingTimes.afternoon.endTime)) {
        // user checkout after end of afternoon working time then set it to end of afternoon working time
        checkOutAt = convertedWorkingTimes.afternoon.endTime;
    } else if (
        moment(checkOutAt).isBetween(
            timeEndMorningMoment,
            timeStartAfternoonMoment,
        )
    ) {
        // if user checkout at the rest time then set it to end of morning working time
        checkOutAt = timeEndMorningMoment;
    }

    let maxWorkingTimeInMinutes = 0;
    if (
        checkInAt.isSameOrBefore(timeEndMorningMoment) &&
        checkOutAt.isSameOrAfter(timeStartAfternoonMoment)
    ) {
        // minus rest time
        maxWorkingTimeInMinutes =
            checkOutAt.diff(checkInAt, 'minutes') - MINUTES_PER_HOUR;
    } else {
        maxWorkingTimeInMinutes = checkOutAt.diff(checkInAt, 'minute');
    }
    // in case checkin and checkout are covered by a request absence then working time is negative
    maxWorkingTimeInMinutes = Math.max(maxWorkingTimeInMinutes, 0);

    return {
        workingHours:
            (maxWorkingTimeInMinutes - leaveMinutesInWork) / MINUTES_PER_HOUR,
        authorizedLeaveHours: leaveMinutesAllDay / MINUTES_PER_HOUR,
        unauthorizedLeaveHours:
            WORKING_HOUR_PER_DAY -
            (maxWorkingTimeInMinutes -
                leaveMinutesInWork +
                leaveMinutesAllDay) /
                MINUTES_PER_HOUR,
    };
}

/**
 * Group timekeeping data by date and map them to user
 * @param user user data
 * @param contract user active contract
 * @param timekeepings timekeeping data
 * @param requestAbsences request absence data
 * @param userTimekeepingHistory timekeeping history
 * @param startDate start date range
 * @param endDate end date range
 * @returns {object} user data with timekeeping and request absence mapped
 */
export function parseUserData(
    user: User,
    contract: Contract,
    timekeepings: Record<string, ITimekeeping>,
    requestAbsences: Record<string, RequestAbsence[]>,
    timekeepingHistory: UserTimekeepingHistory,
    startDate?: string,
    endDate?: string,
) {
    if (!startDate) {
        startDate = moment()
            .tz(TIMEZONE_NAME_DEFAULT)
            .subtract(1, 'month')
            .startOf('month')
            .fmFullTimeString();
    } else {
        startDate = moment(startDate)
            .tz(TIMEZONE_NAME_DEFAULT)
            .fmFullTimeString();
    }
    if (!endDate) {
        endDate = moment()
            .tz(TIMEZONE_NAME_DEFAULT)
            .subtract(1, 'month')
            .endOf('month')
            .fmFullTimeString();
    } else {
        endDate = moment(endDate).tz(TIMEZONE_NAME_DEFAULT).fmFullTimeString();
    }
    const timeRange = moment(endDate).diff(moment(startDate), 'day');
    const timekeepingResult: Record<string, ITimekeeping> = {};
    for (let index = 0; index <= timeRange; index++) {
        const scanAt = moment(startDate)
            .clone()
            .add(index, 'day')
            .fmDayString();

        const currentDateRequestAbsences = requestAbsences?.[scanAt]?.length
            ? requestAbsences[scanAt]
            : [];

        if (!(scanAt in timekeepings)) {
            timekeepingResult[scanAt] = {
                id: null,
                checkIn: null,
                checkOut: null,
                scanAt,
            };
        } else {
            timekeepingResult[scanAt] = timekeepings?.[scanAt];
        }
        timekeepingResult[scanAt].requestAbsences = currentDateRequestAbsences;
    }

    return {
        ...user,
        avatarUrl: user.avatar ? makeFileUrl(user.avatar.fileName) : null,
        paidLeaveHourThisMonth:
            contract?.contractType?.paidLeaveDays * WORKING_HOUR_PER_DAY +
            (+timekeepingHistory?.paidLeaveHoursLeft || 0),
        timekeepings: timekeepingResult,
        timekeepingHistory,
    };
}
