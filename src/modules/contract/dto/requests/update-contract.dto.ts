import * as BaseJoi from 'joi';
import JoiDate from '@joi/date';
const Joi = BaseJoi.extend(JoiDate);
import {
    DATE_TIME_FORMAT,
    INPUT_URL_MAX_LENGTH,
    MAX_INTEGER,
    REGEX,
} from 'src/common/constants';
import { ContractStatus } from '../../contract.constant';

export const UpdateContractSchema = Joi.object().keys({
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
});

export const UpdateContractStatusSchema = Joi.object().keys({
    status: Joi.string().valid(ContractStatus.STOPPED).required(),
    stopDate: Joi.date().when('status', [
        {
            is: ContractStatus.STOPPED,
            then: Joi.date()
                .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
                .required(),
            otherwise: Joi.forbidden(),
        },
    ]),
});

export class UpdateContractDto {
    contractTypeId: number;
    startDate: Date;
    endDate: Date;
    url: string;
    updatedBy: number;
    status: ContractStatus;
}

export class UpdateContractStatusDto {
    status: ContractStatus;
    updatedBy: number;
    endDate?: Date;
    stopDate?: Date;
}
