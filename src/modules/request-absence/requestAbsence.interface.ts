export interface IRequestAbsence {
    startAt?: string | Date | null;
    endAt?: string | Date | null;
    createdAt?: string | Date | null;
}
export interface IGetRequestAbsencesByUserIdQueryString {
    userId: number;
    startDate: string;
    endDate: string;
}
