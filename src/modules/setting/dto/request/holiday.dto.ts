import * as BaseJoi from 'joi';
import JoiDate from '@joi/date';
const Joi = BaseJoi.extend(JoiDate);
import {
    DATE_TIME_FORMAT,
    INPUT_TEXT_MAX_LENGTH,
    ORDER_DIRECTION,
} from 'src/common/constants';

export const holidayListQueryStringSchema = Joi.object().keys({
    startDate: Joi.date()
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .required(),
    endDate: Joi.date()
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .greater(Joi.ref('startDate'))
        .required(),
});
export class HolidayListQueryStringDto {
    startDate?: string;
    endDate?: string;
    orderBy?: string;
    orderDirection?: ORDER_DIRECTION;
}

export const holidaySchema = Joi.object().keys({
    title: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    description: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    date: Joi.date()
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .required(),
});
export interface HolidayDto {
    title: string;
    description: string;
    date: string;
}
