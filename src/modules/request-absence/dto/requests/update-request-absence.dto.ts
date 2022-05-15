import { RequestAbsenceStatus } from '../../requestAbsence.constant';
export class UpdateRequestAbsenceDto {
    userId: number;
    reason?: string;
    startAt: Date;
    endAt: Date;
    status?: RequestAbsenceStatus;
}
