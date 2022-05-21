import * as Joi from 'joi';
import { contractFields, ContractStatus } from '../../contract.constant';

export const CreateContractSchema = Joi.object().keys({
    ...contractFields,
});

export class CreateContractDto {
    userId: number;
    contractTypeId: number;
    startDate: Date;
    endDate: Date;
    url: string;
    status?: ContractStatus;
}
