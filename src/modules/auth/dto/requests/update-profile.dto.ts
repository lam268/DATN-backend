import {
    MIN_TAX_CODE_LENGTH,
    MAX_TAX_CODE_LENGTH,
    MIN_SOCIAL_INSURANCE_LENGTH,
    MAX_SOCIAL_INSURANCE_LENGTH,
} from './../../../../common/constants';
import * as BaseJoi from 'joi';
import JoiDate from '@joi/date';
const Joi = BaseJoi.extend(JoiDate);
import {
    TEXTAREA_MAX_LENGTH,
    INPUT_TEXT_MAX_LENGTH,
    INPUT_MIN_DATE,
    DATE_TIME_FORMAT,
    INPUT_PHONE_MAX_LENGTH,
    MAX_BANK_ACCOUNT_LENGTH,
    MIN_BANK_ACCOUNT_LENGTH,
    MAX_CITIZEN_ID_LENGTH,
    MIN_CITIZEN_ID_LENGTH,
    REGEX,
    MAX_INTEGER,
} from '../../../../common/constants';
import { UserGender } from '../../../user/user.constant';

export const updateProfileSchema = Joi.object({
    fullName: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .label('auth.fields.name'),
    birthday: Joi.date()
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .min(INPUT_MIN_DATE)
        .less('now')
        .optional()
        .label('auth.fields.birthday')
        .allow(null),
    phoneNumber: Joi.string()
        .regex(REGEX.PHONE_NUMBER)
        .max(INPUT_PHONE_MAX_LENGTH)
        .optional()
        .label('auth.fields.phone')
        .allow(null),
    address: Joi.string()
        .allow('')
        .max(TEXTAREA_MAX_LENGTH)
        .optional()
        .label('auth.fields.address')
        .allow(null),
    hometownAddress: Joi.string()
        .allow('')
        .max(TEXTAREA_MAX_LENGTH)
        .optional()
        .label('auth.fields.hometownAddress')
        .allow(null),
    idCardIssuePlace: Joi.string()
        .required()
        .label('auth.fields.idCardIssuePlace'),
    avatarId: Joi.number()
        .positive()
        .max(MAX_INTEGER)
        .optional()
        .label('auth.fields.avatarId')
        .allow(null),
    gender: Joi.string()
        .valid(...Object.values(UserGender))
        .required()
        .label('auth.fields.gender'),
    position: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .label('auth.fields.position'),
    bank: Joi.string()
        .allow(null)
        .max(INPUT_TEXT_MAX_LENGTH)
        .required('user.fields.bank'),
    bankAccount: Joi.string()
        .allow(null)
        .max(MAX_BANK_ACCOUNT_LENGTH)
        .min(MIN_BANK_ACCOUNT_LENGTH)
        .required('user.fields.bankAccount'),
    taxCode: Joi.string()
        .allow(null, '')
        .min(MIN_TAX_CODE_LENGTH)
        .max(MAX_TAX_CODE_LENGTH)
        .label('user.fields.taxCode'),
    socialInsurance: Joi.string()
        .allow(null, '')
        .min(MIN_SOCIAL_INSURANCE_LENGTH)
        .max(MAX_SOCIAL_INSURANCE_LENGTH)
        .label('user.fields.socialInsurance'),
    citizenId: Joi.string()
        .allow(null)
        .max(MAX_CITIZEN_ID_LENGTH)
        .min(MIN_CITIZEN_ID_LENGTH)
        .required('user.fields.socialInsurance'),
    citizenIdIssuedAt: Joi.date()
        .allow(null)
        .format(DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON)
        .min(INPUT_MIN_DATE)
        .less('now')
        .optional()
        .label('user.fields.citizenIdIssuedAt'),
    provinceId: Joi.number()
        .positive()
        .max(MAX_INTEGER)
        .optional()
        .label('user.fields.provinceId')
        .allow(null),
});

export class UpdateProfileDto {
    fullName!: string;
    birthday!: Date;
    phoneNumber!: string;
    idCardIssuePlace!: string;
    avatarId!: number;
    gender!: UserGender;
    provinceId!: number;
    bank!: string;
    bankAccount!: string;
    citizenId!: string;
    hometownAddress: string;
    address: string;
    taxCode: string;
    socialInsurance: string;
}
