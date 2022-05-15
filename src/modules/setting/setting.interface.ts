export interface IHolidayData {
    title: string;
    description: string;
    date: string | null;
    createdBy?: number;
}

export interface IContractType {
    name: string;
    expiredIn: number;
    paidLeaveDays: number;
    description: string;
}
