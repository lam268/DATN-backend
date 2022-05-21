import {
    INPUT_TEXT_MAX_LENGTH,
    DATE_TIME_FORMAT,
    MAX_PAGE_SIZE,
    MAX_PAGE,
    MAX_INTEGER,
} from '../../../../common/constants';
import { MIN_PAGE_SIZE, MIN_PAGE } from '../../../../common/constants';
import { ORDER_DIRECTION } from 'src/common/constants';
import {
    ContractGroupBy,
    ContractOrderBy,
    ContractStatus,
} from '../../contract.constant';
import * as BaseJoi from 'joi';
import JoiDate from '@joi/date';
const Joi = BaseJoi.extend(JoiDate);

export const ContractListQueryStringSchema = Joi.object().keys({
    page: Joi.number().min(MIN_PAGE).max(MAX_PAGE).optional(),
    limit: Joi.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).optional(),
    keyword: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional(),
    orderBy: Joi.string()
        .valid(...Object.values(ContractOrderBy))
        .optional(),
    orderDirection: Joi.string()
        .valid(...Object.values(ORDER_DIRECTION))
        .optional(),
    groupBy: Joi.string()
        .valid(...Object.values(ContractGroupBy))
        .optional(),
    contractTypeIds: Joi.array()
        .items(Joi.number().positive().max(MAX_INTEGER))
        .optional()
        .label('contract.fields.contractTypeId'),
    statuses: Joi.array()
        .items(Joi.string().valid(...Object.values(ContractStatus)))
        .optional()
        .label('contract.fields.status'),
    userIds: Joi.array()
        .items(Joi.number().positive().max(MAX_INTEGER))
        .optional()
        .label('contract.fields.userId'),
    startDate: Joi.array()
        .items(
            Joi.date().format(
                DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON,
            ),
        )
        .optional()
        .length(2)
        .allow('')
        .label('contract.fields.startDate'),
    endDate: Joi.array()
        .items(
            Joi.date().format(
                DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON,
            ),
        )
        .optional()
        .length(2)
        .allow('')
        .label('contract.fields.endDate'),
    stopDate: Joi.array()
        .items(
            Joi.date().format(
                DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON,
            ),
        )
        .optional()
        .length(2)
        .allow('')
        .label('contract.fields.stopDate'),
});
export class ContractQueryStringDto {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: ORDER_DIRECTION;
    groupBy?: ContractGroupBy;
    userIds?: number[];
    startDate?: Date;
    endDate?: Date;
    stopDate?: Date;
    contractTypeIds?: number[];
    statuses?: ContractStatus[];
}
