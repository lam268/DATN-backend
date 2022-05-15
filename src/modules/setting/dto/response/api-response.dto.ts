import { CommonListResponse } from 'src/common/helpers/api.response';
import { ContractTypeResponseDto } from './contract-type-response.dto';

export class ContractTypeList extends CommonListResponse<ContractTypeResponseDto> {
    items: ContractTypeResponseDto[];
}
