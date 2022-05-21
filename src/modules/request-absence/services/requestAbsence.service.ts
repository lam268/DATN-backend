import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_PAGINATION,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    TIMEZONE_NAME_DEFAULT,
    TYPE_ORM_ORDER_DIRECTION,
    workingTimes,
} from 'src/common/constants';
import { Brackets, EntityManager, In, Not } from 'typeorm';
import { RequestAbsenceListQueryStringDto } from '../dto/requests/get-request-absences-request.dto';
import { CreateRequestAbsenceDto } from '../dto/requests/create-request-absence.dto';
import { RequestAbsenceResponseDto } from '../dto/responses/request-absences-response.dto';
import { UpdateRequestAbsenceDto } from '../dto/requests/update-request-absence.dto';
import moment from '~plugins/moment';
import {
    requestAbsenceAttributes,
    RequestAbsenceOrderBy,
    RequestAbsenceStatus,
} from '../requestAbsence.constant';
import { File } from 'src/modules/file/entity/file.entity';
import { RequestAbsence } from '../entity/request-absences.entity';
import { User } from 'src/modules/user/entity/user.entity';
import { isWeekend, makeFileUrl } from 'src/common/helpers/common.function';
import { IGetRequestAbsencesByUserIdQueryString } from '../requestAbsence.interface';
import { HolidayService } from 'src/modules/setting/services/holiday.service';

@Injectable()
export class RequestAbsenceService {
    constructor(
        @InjectEntityManager()
        private readonly dbManager: EntityManager,
        private readonly holidayService: HolidayService,
    ) {}

    async getRequestAbsences(query: RequestAbsenceListQueryStringDto) {
        const {
            page = DEFAULT_FIRST_PAGE,
            limit = DEFAULT_LIMIT_FOR_PAGINATION,
            keyword,
            orderBy = DEFAULT_ORDER_BY,
            orderDirection = DEFAULT_ORDER_DIRECTION,
            startAt,
            endAt,
            userIds = [],
            status,
        } = query;
        try {
            const _queryBuilder = await this.dbManager
                .createQueryBuilder(RequestAbsence, 'requestAbsence')
                .leftJoinAndMapOne(
                    'requestAbsence.userInfo',
                    User,
                    'user',
                    'user.id = requestAbsence.userId',
                )
                .leftJoinAndMapOne(
                    'requestAbsence.avatarInfo',
                    File,
                    'file',
                    'file.id = user.avatarId',
                )
                .where((queryBuilder) => {
                    this.generateQueryBuilder(queryBuilder, {
                        keyword,
                        startAt,
                        endAt,
                        status,
                        userIds,
                    });
                })
                .select(requestAbsenceAttributes);
            if (orderBy) {
                if (orderBy === RequestAbsenceOrderBy.FULL_NAME) {
                    _queryBuilder.orderBy(
                        `user.fullName`,
                        orderDirection.toUpperCase() as TYPE_ORM_ORDER_DIRECTION,
                    );
                } else {
                    _queryBuilder.orderBy(
                        `requestAbsence.${orderBy}`,
                        orderDirection.toUpperCase() as TYPE_ORM_ORDER_DIRECTION,
                    );
                }
            }
            if (limit && page)
                _queryBuilder.take(limit).skip((page - 1) * limit);
            const [items, totalItems] = await _queryBuilder.getManyAndCount();
            return {
                items: items.map((item) => ({
                    ...item,
                    avatarInfo: item.avatarInfo
                        ? {
                              ...item.avatarInfo,
                              url: makeFileUrl(item.avatarInfo.fileName),
                          }
                        : null,
                })),
                totalItems,
            };
        } catch (error) {
            throw error;
        }
    }

    async getRequestAbsenceById(id: number) {
        try {
            const requestAbsence = this.dbManager.findOne(RequestAbsence, {
                where: { id },
            });
            return requestAbsence;
        } catch (error) {
            throw error;
        }
    }

    async createRequestAbsence(
        requestAbsence: CreateRequestAbsenceDto,
    ): Promise<RequestAbsenceResponseDto> {
        try {
            const insertedRequestAbsence = await this.dbManager
                .getRepository(RequestAbsence)
                .insert(requestAbsence);
            const requestAbsenceId = insertedRequestAbsence?.identifiers[0]?.id;
            if (insertedRequestAbsence) {
                const contractTypeDetail = await this.getRequestAbsenceById(
                    requestAbsenceId,
                );
                return contractTypeDetail;
            }
            throw new InternalServerErrorException();
        } catch (error) {
            throw error;
        }
    }

    async updateRequestAbsence(
        id: number,
        requestAbsence: UpdateRequestAbsenceDto,
    ) {
        try {
            await this.dbManager
                .getRepository(RequestAbsence)
                .update(id, requestAbsence);
            const updatedRequestAbsence = await this.getRequestAbsenceById(id);
            return updatedRequestAbsence;
        } catch (error) {
            throw error;
        }
    }

    async deleteRequestAbsence(id: number, deletedBy: number) {
        try {
            await this.dbManager.update(
                RequestAbsence,
                { id },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
            );
        } catch (error) {
            throw error;
        }
    }

    generateQueryBuilder(
        queryBuilder,
        { keyword, startAt, endAt, userIds, status },
    ) {
        if (userIds.length) {
            queryBuilder.andWhere({
                userId: In(userIds),
            });
        }

        if (startAt?.length === 2) {
            queryBuilder.andWhere(
                'requestAbsence.startAt >= :startOfStartDateRange AND requestAbsence.startAt <= :endOfStartDateRange',
                {
                    startOfStartDateRange: startAt[0],
                    endOfStartDateRange: startAt[1],
                },
            );
        }

        if (endAt?.length === 2) {
            queryBuilder.andWhere(
                'requestAbsence.endAt >= :startOfEndDateRange AND requestAbsence.endAt <= :endOfEndDateRange',
                {
                    startOfEndDateRange: endAt[0],
                    endOfEndDateRange: endAt[1],
                },
            );
        }

        if (keyword) {
            const likeKeyword = `%${keyword}%`;
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.where('reason LIKE :keyword', {
                        keyword: likeKeyword,
                    })
                        .orWhere('user.id LIKE :keyword', {
                            keyword: likeKeyword,
                        })
                        .orWhere('user.email LIKE :keyword', {
                            keyword: likeKeyword,
                        })
                        .orWhere('user.fullName LIKE :keyword', {
                            keyword: likeKeyword,
                        });
                }),
            );
        }
        if (status?.length) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.andWhere('requestAbsence.status IN(:status)', {
                        status,
                    });
                }),
            );
        }
    }

    async checkTimeOverlap(
        userId: number,
        startAt: Date | string,
        endAt: Date | string,
        requestAbsenceId?: number,
    ): Promise<boolean> {
        try {
            const startDay = moment(startAt).fmFullTimeString();
            const endDay = moment(endAt).fmFullTimeString();
            const _queryBuilder = await this.dbManager
                .createQueryBuilder(RequestAbsence, 'requestAbsence')
                .where((queryBuilder) => {
                    queryBuilder.where(
                        new Brackets((qb) => {
                            qb.where('startAt BETWEEN :startDay AND :endDay', {
                                startDay,
                                endDay,
                            })
                                .orWhere(
                                    'endAt BETWEEN :startDay AND :endDay',
                                    {
                                        startDay,
                                        endDay,
                                    },
                                )
                                .orWhere(
                                    'startAt < :startDay AND endAt > :endDay',
                                    {
                                        startDay,
                                        endDay,
                                    },
                                );
                        }),
                    );
                    queryBuilder.andWhere({
                        userId,
                    });
                    queryBuilder.andWhere({
                        status: Not(RequestAbsenceStatus.REJECTED),
                    });
                    if (requestAbsenceId) {
                        queryBuilder.andWhere('requestAbsence.id != :id', {
                            id: requestAbsenceId,
                        });
                    }
                })
                .getRawMany();
            return _queryBuilder.length === 0;
        } catch (error) {
            throw error;
        }
    }

    async getAllRequestAbsences(query: RequestAbsenceListQueryStringDto) {
        const { startAt, endAt, userIds = [], status } = query;
        try {
            const _queryBuilder = await this.dbManager
                .createQueryBuilder(RequestAbsence, 'requestAbsence')
                .leftJoinAndMapOne(
                    'requestAbsence.userInfo',
                    User,
                    'user',
                    'user.id = requestAbsence.userId',
                )
                .leftJoinAndMapOne(
                    'requestAbsence.avatarInfo',
                    File,
                    'file',
                    'file.id = user.avatarId',
                )
                .where((queryBuilder) => {
                    queryBuilder.andWhere(
                        new Brackets((qb) => {
                            qb.where(
                                '(startAt >= :startAt AND startAt <= :endAt) OR (endAt >= :startAt AND endAt <= :endAt)',
                                {
                                    startAt,
                                    endAt,
                                },
                            );
                        }),
                    );
                    if (userIds.length) {
                        queryBuilder.andWhere({
                            userId: In(userIds),
                        });
                    }

                    if (status?.length) {
                        queryBuilder.andWhere(
                            new Brackets((qb) => {
                                qb.andWhere(
                                    'requestAbsence.status IN(:status)',
                                    {
                                        status,
                                    },
                                );
                            }),
                        );
                    }
                })
                .select(requestAbsenceAttributes);
            const [items, totalItems] = await _queryBuilder.getManyAndCount();
            return {
                items: items.map((item) => ({
                    ...item,
                    avatarInfo: item.avatarInfo
                        ? {
                              ...item.avatarInfo,
                              url: makeFileUrl(item.avatarInfo.fileName),
                          }
                        : null,
                })),
                totalItems,
            };
        } catch (error) {
            throw error;
        }
    }

    async getRequestAbsencesByUserId(
        query: IGetRequestAbsencesByUserIdQueryString,
    ) {
        const { userId, startDate, endDate } = query;
        const holidays = await this.holidayService.getHolidayList({
            startDate,
            endDate,
        });
        const holidayDates = new Map<string, boolean>();
        holidays.items.forEach((holiday) => {
            holidayDates.set(
                moment(holiday.date).tz(TIMEZONE_NAME_DEFAULT).fmDayString(),
                true,
            );
        });
        try {
            const requestAbsences = await this.dbManager.find(RequestAbsence, {
                where: (queryBuilder) => {
                    queryBuilder.andWhere(
                        new Brackets((qb) => {
                            qb.where(
                                '(startAt >= :startDate AND startAt <= :endDate) OR (endAt >= :startDate AND endAt <= :endDate)',
                                {
                                    startDate,
                                    endDate,
                                },
                            );
                        }),
                    );
                    queryBuilder.andWhere({
                        userId,
                    });
                    queryBuilder.andWhere({
                        status: RequestAbsenceStatus.APPROVED,
                    });
                },
            });
            return requestAbsences.reduce(
                (requestAbsencesMappedToDate, requestAbsence) => {
                    const requestAbsenceStartAt = moment(requestAbsence.startAt)
                        .tz(TIMEZONE_NAME_DEFAULT)
                        .fmDayString();
                    const requestAbsenceEndAt = moment(requestAbsence.endAt)
                        .tz(TIMEZONE_NAME_DEFAULT)
                        .fmDayString();

                    const requestAbsenceDuration = moment(
                        requestAbsenceEndAt,
                    ).diff(moment(requestAbsenceStartAt), 'd');
                    for (let i = 0; i <= requestAbsenceDuration; ++i) {
                        const currentDay = moment(requestAbsence.startAt)
                            .tz(TIMEZONE_NAME_DEFAULT)
                            .add(i, 'd')
                            .fmDayString();
                        if (
                            isWeekend(currentDay) ||
                            holidayDates.has(currentDay)
                        ) {
                            continue;
                        }
                        let startAt!: string;
                        let endAt!: string;
                        if (currentDay === requestAbsenceStartAt) {
                            startAt = moment(requestAbsence.startAt)
                                .tz(TIMEZONE_NAME_DEFAULT)
                                .fmFullTimeString();
                        } else {
                            startAt = moment(currentDay)
                                .hour(workingTimes.morning.startHour)
                                .minute(workingTimes.morning.startMinute)
                                .second(0)
                                .fmFullTimeString();
                        }
                        if (currentDay === requestAbsenceEndAt) {
                            endAt = moment(requestAbsence.endAt)
                                .tz(TIMEZONE_NAME_DEFAULT)
                                .fmFullTimeString();
                        } else {
                            endAt = moment(currentDay)
                                .hour(workingTimes.afternoon.endHour)
                                .minute(workingTimes.afternoon.endMinute)
                                .second(0)
                                .fmFullTimeString();
                        }

                        if (currentDay in requestAbsencesMappedToDate) {
                            requestAbsencesMappedToDate[currentDay].push({
                                startAt,
                                endAt,
                                createdAt: requestAbsence.createdAt,
                            });
                        } else {
                            requestAbsencesMappedToDate[currentDay] = [
                                {
                                    startAt,
                                    endAt,
                                    createdAt: requestAbsence.createdAt,
                                },
                            ];
                        }
                    }
                    return requestAbsencesMappedToDate;
                },
                {},
            );
        } catch (error) {
            throw error;
        }
    }
}
