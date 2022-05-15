import { CommonListResponse } from 'src/common/helpers/api.response';
import { RequestAbsence } from '../../entity/request-absences.entity';

export class RequestAbsenceResponse extends CommonListResponse<RequestAbsence> {
    items: RequestAbsence[];
}
