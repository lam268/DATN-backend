import * as BaseJoi from 'joi';
import JoiDate from '@joi/date';
import {
    DATE_TIME_FORMAT,
    INPUT_MIN_DATE,
    INPUT_TEXT_MAX_LENGTH,
    MAX_INTEGER,
    MAX_PAGE,
    MAX_PAGE_SIZE,
    MIN_PAGE,
    MIN_PAGE_SIZE,
    ORDER_DIRECTION,
    TEXTAREA_MAX_LENGTH,
    workingTimes,
} from 'src/common/constants';
import {
    RequestAbsenceOrderBy,
    RequestAbsenceStatus,
} from '../../requestAbsence.constant';
import moment from 'moment';
import { getHourFromTime } from 'src/common/helpers/common.function';

const Joi = BaseJoi.extend(JoiDate);

export const CreateRequestAbsenceSchema = Joi.object()
    .keys({
        userId: Joi.number()
            .required()
            .positive()
            .max(MAX_INTEGER)
            .label('request-absence.fields.userId'),
        reason: Joi.string()
            .max(TEXTAREA_MAX_LENGTH)
            .optional()
            .label('request-absence.fields.reason'),
        startAt: Joi.date()
            .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
            .min(INPUT_MIN_DATE)
            .required()
            .label('request-absence.fields.startAt'),
        endAt: Joi.date()
            .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
            .min(INPUT_MIN_DATE)
            .greater(Joi.ref('startAt'))
            .required()
            .label('request-absence.fields.endAt'),
        status: Joi.string()
            .valid(...Object.values(RequestAbsenceStatus))
            .label('request-absence.fields.status'),
    })
    .custom(async (body, helpers) => {
        const { startAt, endAt } = body;
        const hourStartAt = +moment(startAt).fmHourOnlyTimeString();
        const hourEndAt = +moment(endAt).fmHourOnlyTimeString();
        if (
            hourStartAt < getHourFromTime(workingTimes.morning.startTime) ||
            hourEndAt > getHourFromTime(workingTimes.afternoon.endTime)
        ) {
            return helpers.message('request-absence.common.error.outOff');
        }
        return true;
    });

export const RequestAbsenceListQueryStringSchema = Joi.object().keys({
    page: Joi.number()
        .optional()
        .min(MIN_PAGE)
        .max(MAX_PAGE)
        .label('request-absence.fields.page'),
    limit: Joi.number()
        .min(MIN_PAGE_SIZE)
        .max(MAX_PAGE_SIZE)
        .optional()
        .label('request-absence.fields.limit'),
    keyword: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional()
        .label('request-absence.fields.keyword'),
    orderBy: Joi.string()
        .valid(...Object.values(RequestAbsenceOrderBy))
        .optional()
        .label('request-absence.fields.orderBy'),
    orderDirection: Joi.string()
        .valid(...Object.values(ORDER_DIRECTION))
        .optional()
        .label('request-absence.fields.orderDirection'),
    endAt: Joi.array()
        .items(
            Joi.date().format(
                DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON,
            ),
        )
        .optional()
        .length(2)
        .allow('')
        .label('request-absence.fields.endAt'),
    startAt: Joi.array()
        .items(
            Joi.date().format(
                DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON,
            ),
        )
        .optional()
        .length(2)
        .allow('')
        .label('request-absence.fields.startAt'),
    status: Joi.array()
        .items(Joi.string().valid(...Object.values(RequestAbsenceStatus)))
        .optional()
        .label('request-absence.fields.status'),
    userId: Joi.number()
        .positive()
        .max(MAX_INTEGER)
        .optional()
        .label('request-absence.fields.userId'),
});

export const UpdateRequestAbsenceSchema = Joi.object()
    .keys({
        userId: Joi.number()
            .required()
            .positive()
            .max(MAX_INTEGER)
            .label('request-absence.fields.userId'),
        reason: Joi.string()
            .max(TEXTAREA_MAX_LENGTH)
            .optional()
            .label('request-absence.fields.reason'),
        startAt: Joi.date()
            .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
            .min(INPUT_MIN_DATE)
            .label('request-absence.fields.startAt'),
        endAt: Joi.date()
            .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
            .min(INPUT_MIN_DATE)
            .greater(Joi.ref('startAt'))
            .label('request-absence.fields.reason'),
    })
    .custom(async (body, helpers) => {
        const { startAt, endAt } = body;
        const hourStartAt = +moment(startAt).fmHourOnlyTimeString();
        const hourEndAt = +moment(endAt).fmHourOnlyTimeString();

        if (
            hourStartAt < getHourFromTime(workingTimes.morning.startTime) ||
            hourEndAt > getHourFromTime(workingTimes.afternoon.endTime)
        ) {
            return helpers.message('request-absence.common.error.outOff');
        }
        return true;
    });

export const RequestAbasenceStatusSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(RequestAbsenceStatus)),
});
export class RequestAbsenceListQueryStringDto {
    page?: number;
    limit?: number;
    orderBy?: RequestAbsenceOrderBy;
    orderDirection?: ORDER_DIRECTION;
    keyword?: string;
    startAt?: string;
    endAt?: string;
    userIds?: number[];
    status?: RequestAbsenceStatus[];
}
