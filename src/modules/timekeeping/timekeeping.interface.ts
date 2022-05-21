import { Contract } from '../contract/entity/contract.entity';
import { IRequestAbsence } from '../request-absence/requestAbsence.interface';
import { IContractType } from '../setting/setting.interface';
import { User } from '../user/entity/user.entity';

export interface IUserTimekeeping {
    userId?: number;
    fullName?: string;
    timekeepings?: ITimekeeping[];
    requestAbsences?: IRequestAbsence[];
    avatarName: string | null;
    avatarId: string | null;
    position: string;
    paidLeaveHoursLeft?: number;
    paidLeaveDays?: number;
}
export interface ITimekeeping {
    id: number | null;
    checkIn: string | null;
    checkOut: string | null;
    scanAt: string;
    requestAbsences?: IRequestAbsence[];
    workingHours?: number;
    authorizedLeaveHours?: number;
    unauthorizedLeaveHours?: number;
}

export interface IUpdateUserFinger {
    userId: number;
    fingerId: number;
}

export interface IUserTimekeepingHistory {
    userId?: number;
    month?: number;
    year?: number;
    paidLeaveHoursLeft?: number;
    paidLeaveHoursUsed?: number;
}

export interface UpdatePaidLeaveDaysData {
    userId: number;
    month: number;
    year: number;
    paidLeaveHours: number;
    paidLeaveHoursUsed: number;
    paidLeaveHoursLeft: number;
}

export interface IGetUserTimekeepingHistoryQueryString {
    userId: number;
    year: number;
    month: number;
}

export interface IGetTimekeepingsByUserIdQueryString {
    userId: number;
    startDate: string;
    endDate: string;
}

export interface ITimekeepingGroupByDate {
    user?: User;
    userId?: number;
    contract?: Contract;
    contractType?: IContractType;
    timekeepings?: Record<string, ITimekeeping>;
    timekeepingHistory?: IUserTimekeepingHistory;
    paidLeaveHoursLeft?: number; // the remain paidLeave hours of this user
}
