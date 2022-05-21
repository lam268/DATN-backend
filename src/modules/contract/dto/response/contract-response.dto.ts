import { ContractType } from 'src/modules/setting/entity/contract-type.entity';
import { User } from 'src/modules/user/entity/user.entity';
import { ContractStatus } from '../../contract.constant';

export class ContractResponseDto {
    id: number;
    user?: User;
    status?: ContractStatus;
    contractTypeId?: number;
    contractType?: ContractType;
    startDate?: Date;
    endDate?: Date;
    stopDate?: Date;
    url?: string;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: number;
    updatedBy?: number;
}
