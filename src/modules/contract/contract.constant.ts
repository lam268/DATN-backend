import * as BaseJoi from 'joi';
import JoiDate from '@joi/date';
const Joi = BaseJoi.extend(JoiDate);
import {
    DATE_TIME_FORMAT,
    REGEX,
    MAX_INTEGER,
    INPUT_URL_MAX_LENGTH,
} from '../../common/constants';

export const MODULE_NAME = 'contract';

export enum ContractStatus {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    STOPPED = 'stopped',
    ABOUT_TO_EXPIRE = 'aboutToExpire',
    ABOUT_TO_ACTIVE = 'aboutToActive',
}

export const contractFields = {
    userId: Joi.number()
        .positive()
        .max(MAX_INTEGER)
        .required()
        .label('contract.fields.userId'),
    contractTypeId: Joi.number()
        .positive()
        .max(MAX_INTEGER)
        .required()
        .label('contract.fields.contractTypeId'),
    startDate: Joi.date()
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .required()
        .label('contract.fields.startDate'),
    url: Joi.string()
        .max(INPUT_URL_MAX_LENGTH)
        .regex(REGEX.URL)
        .required()
        .label('contract.fields.URL'),
};

export enum ContractOrderBy {
    CREATED_AT = 'contract.createdAt',
    FULL_NAME = 'user.fullName',
    CONTRACT_TYPE = 'contractType.id',
    START_DATE = 'contract.startDate',
    END_DATE = 'contract.endDate',
    STATUS = 'contract.status',
    USER_ID = 'user.id',
}

export enum ContractGroupBy {
    CONTRACT = 'contract',
    USER = 'user',
}
