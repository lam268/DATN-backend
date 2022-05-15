import { RequestAbsenceStatus } from '../../requestAbsence.constant';

export class CreateRequestAbsenceDto {
    userId: number;
    reason?: string;
    startAt: Date;
    endAt: Date;
    status: RequestAbsenceStatus;
    createdBy?: number;
}
