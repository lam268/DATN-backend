import {
    ApiResponse,
    CommonListResponse,
} from 'src/common/helpers/api.response';
import { ContractResponseDto } from './contract-response.dto';

export class ContractList extends CommonListResponse<ContractResponseDto> {
    items: ContractResponseDto[];
    totalItems: number;
}

export class ContractListResult extends ApiResponse<ContractList> {
    data: ContractList;
}

export class ContractDetailResult extends ApiResponse<ContractResponseDto> {
    data: ContractResponseDto;
}

export class ContractRemoveResponseDto {
    id: number;
}

export class RemoveContractResult extends ApiResponse<ContractRemoveResponseDto> {
    data: ContractRemoveResponseDto;
}
