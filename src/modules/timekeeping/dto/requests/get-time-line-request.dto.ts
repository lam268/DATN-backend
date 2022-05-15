import * as BaseJoi from 'joi';
import JoiDate from '@joi/date';
import {
    DATE_TIME_FORMAT,
    INPUT_TEXT_MAX_LENGTH,
    MAX_INTEGER,
    MAX_PAGE,
    MAX_PAGE_SIZE,
    MIN_PAGE,
    MIN_PAGE_SIZE,
    ORDER_DIRECTION,
} from 'src/common/constants';
import { TimekeepingOrderBy } from '../../timekeeping.constant';

const Joi = BaseJoi.extend(JoiDate);

import { UserStatus } from 'src/modules/user/user.constant';
export class TimekeepingListQueryStringDto {
    page?: number;
    limit?: number;
    keyword?: string;
    month?: string;
    startDate?: string;
    endDate?: string;
    orderBy?: TimekeepingOrderBy;
    orderDirection?: ORDER_DIRECTION;
    userIds?: number[];
    statuses?: UserStatus[];
}

export class ExportTimekeepingDto {
    startDate?: string;
    endDate?: string;
    userIds?: number[];
}

export class TimekeepingDashboardQueryStringDto {
    startDate: string;
    endDate: string;
}

export class TimeLineListForCronJobQueryStringDto {
    month?: string;
}
export const TimekeepingDashboardQueryStringSchema = Joi.object().keys({
    page: Joi.number()
        .optional()
        .min(MIN_PAGE)
        .max(MAX_PAGE)
        .label('timekeeping.fields.page'),
    limit: Joi.number()
        .min(MIN_PAGE_SIZE)
        .max(MAX_PAGE_SIZE)
        .optional()
        .label('timekeeping.fields.limit'),
    keyword: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .label('timekeeping.fields.keyword'),
    startDate: Joi.date()
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .optional()
        .label('timekeeping.fields.startAt'),
    endDate: Joi.date()
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .optional()
        .label('timekeeping.fields.endAt'),
    orderBy: Joi.string()
        .valid(...Object.values(TimekeepingOrderBy))
        .optional()
        .label('timekeeping.fields.orderBy'),
    orderDirection: Joi.string()
        .valid(...Object.values(ORDER_DIRECTION))
        .optional()
        .label('timekeeping.fields.orderDirection'),
    userIds: Joi.array()
        .items(Joi.number().positive().max(MAX_INTEGER))
        .optional(),
});

export const TimekeepingListQueryStringSchema = Joi.object().keys({
    page: Joi.number()
        .optional()
        .min(MIN_PAGE)
        .max(MAX_PAGE)
        .label('timekeeping.fields.page'),
    limit: Joi.number()
        .min(MIN_PAGE_SIZE)
        .max(MAX_PAGE_SIZE)
        .optional()
        .label('timekeeping.fields.limit'),
    keyword: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .label('timekeeping.fields.keyword'),
    startDate: Joi.date()
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .optional(),
    endDate: Joi.date()
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .optional(),
    orderBy: Joi.string()
        .valid(...Object.values(TimekeepingOrderBy))
        .optional()
        .label('timekeeping.fields.orderBy'),
    orderDirection: Joi.string()
        .valid(...Object.values(ORDER_DIRECTION))
        .optional()
        .label('timekeeping.fields.orderDirection'),
    userIds: Joi.array()
        .items(Joi.number().positive().max(MAX_INTEGER))
        .optional(),
    statuses: Joi.array()
        .items(Joi.string().valid(...Object.values(UserStatus)))
        .optional()
        .label('timekeeping.fields.status'),
});
