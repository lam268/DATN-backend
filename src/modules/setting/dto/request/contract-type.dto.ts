import {
    INPUT_TEXT_MAX_LENGTH,
    MAX_INTEGER,
    MAX_LENGTH_DAYS_OF_MONTH,
    MAX_PAGE,
    MAX_PAGE_SIZE,
    TEXTAREA_MAX_LENGTH,
} from '../../../../common/constants';
import { MIN_PAGE_SIZE, MIN_PAGE } from '../../../../common/constants';
import { ORDER_DIRECTION } from 'src/common/constants';
import * as Joi from 'joi';
import { ContractTypeOrderBy } from '../../setting.constant';

export type UpdateContractTypeDto = IContractTypeDto;

export const ContractTypeListQueryStringSchema = Joi.object().keys({
    page: Joi.number().min(MIN_PAGE).max(MAX_PAGE).optional(),
    limit: Joi.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).optional(),
    keyword: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow('', null),
    orderBy: Joi.string().optional(),
    orderDirection: Joi.string()
        .valid(ORDER_DIRECTION.ASC, ORDER_DIRECTION.DESC)
        .optional(),
});

export const saveContractTypeSchema = Joi.object().keys({
    name: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .label('contract-type.fields.name'),
    expiredIn: Joi.number()
        .positive()
        .max(MAX_INTEGER)
        .optional()
        .allow(null)
        .label('contract-type.fields.expiredIn'),
    paidLeaveDays: Joi.number()
        .min(0)
        .max(MAX_LENGTH_DAYS_OF_MONTH)
        .required()
        .label('contract-type.fields.paidLeaveDays'),
    description: Joi.string()
        .max(TEXTAREA_MAX_LENGTH)
        .label('contract-type.fields.description')
        .allow(null, ''),
});

export const UpdateContractTypeSchema = saveContractTypeSchema;
export interface IContractTypeQueryStringDto {
    page?: number;
    limit?: number;
    keyword?: string;
    orderBy?: ContractTypeOrderBy;
    orderDirection?: ORDER_DIRECTION;
}

export interface IContractTypeDto {
    name: string;
    expiredIn: number;
    paidLeaveDays: number;
    description?: string;
    createdBy?: number;
    updatedBy?: number;
}
