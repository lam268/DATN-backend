import { RequestAbsenceStatus } from '../../requestAbsence.constant';

export class RequestAbsenceResponseDto {
    id: number;
    userId: number;
    reason?: string;
    startAt: Date;
    endAt: Date;
    status: RequestAbsenceStatus;
}
