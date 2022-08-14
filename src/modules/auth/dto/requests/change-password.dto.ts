import * as Joi from 'joi';
import { INPUT_TEXT_MAX_LENGTH } from 'src/common/constants';

export const ChangePasswordSchema = Joi.object({
    oldPassword: Joi.string()
        .min(6)
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .label('auth.fields.password'),
    reNewPassword: Joi.string()
        .min(6)
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .label('auth.fields.password'),
});
export class ChangePasswordDto {
    readonly oldPassword: string;
    readonly newPassword: string;
}
