import * as BaseJoi from 'joi';
import JoiDate from '@joi/date';
import {
    DATE_TIME_FORMAT,
    INPUT_MIN_DATE,
    MAX_INTEGER,
} from 'src/common/constants';

const Joi = BaseJoi.extend(JoiDate);

export const TimekeepingSchema = {
    checkIn: Joi.date().label('timekeeping.fields.startAt'),
    checkOut: Joi.date()
        .greater(Joi.ref('checkIn'))
        .label('timekeeping.fields.endAt'),
    scanAt: Joi.date().label('timekeeping.fields.scanAt'),
};

export const CreateTimekeepingSchema = Joi.object().keys({
    ...TimekeepingSchema,
    userId: Joi.number()
        .positive()
        .max(MAX_INTEGER)
        .label('timekeeping.fields.userId'),
});

export const UpdateTimekeepingSchema = Joi.object().keys({
    ...TimekeepingSchema,
    userId: Joi.number()
        .positive()
        .max(MAX_INTEGER)
        .label('timekeeping.fields.userId'),
});

export const ExportTimekeepingSchema = Joi.object().keys({
    userIds: Joi.array()
        .items(Joi.number())
        .optional()
        .label('timekeeping.exportData.requestBody.userIds'),
    startDate: Joi.date()
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .min(INPUT_MIN_DATE)
        .required(),
    endDate: Joi.date()
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .min(INPUT_MIN_DATE)
        .greater(Joi.ref('startDate'))
        .required(),
});
export class TimekeepingDto {
    checkIn?: string;
    checkOut?: string;
    scanAt?: string;
    userId?: number;
}
