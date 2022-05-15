import { User } from '../user/entity/user.entity';
import { UserTimekeepingHistory } from './entity/user-timekeeping-history.entity';
import { Timekeeping } from './entity/timekeeping.entity';

export const MODULE_NAME = 'timekeeping';

export enum TIME_KEEPING_EXCEL_DATA_SIGN {
    FULL_TIME_WORK = 'X',
    AUTHORIZED_FULL_DAY_LEAVE = 'P',
    UNAUTHORIZED_FULL_DAY_LEAVE = 'KP',
}

export enum DAYS_IN_WEEK_OF_EXCEL_TABLE {
    MONDAY = 'T2',
    TUESDAY = 'T3',
    WEDNESDAY = 'T4',
    THURSDAY = 'T5',
    FRIDAY = 'T6',
    SATURDAY = 'T7',
    SUNDAY = 'CN',
}

export const dat = 'dat';
export const LastMonthOfTheYear = 12;

export const userTimekeepingHistoryAttributes: (keyof UserTimekeepingHistory)[] =
    ['userId', 'month', 'year', 'paidLeaveHoursLeft', 'paidLeaveHoursUsed'];

export const userDetailAttributes: (keyof User)[] = [
    'id',
    'email',
    'fullName',
    'fingerId',
];

export const userTimekeepingAttributes = [
    'user.id',
    'user.avatarId',
    'user.fullName',
    'file.fileName',
];

export const timekeepingAttributes = [
    'id',
    'userId',
    'fingerId',
    'checkIn',
    'checkOut',
    'scanAt',
];

export const timekeepingListAttributes: (keyof Timekeeping)[] = [
    'userId',
    'id',
    'userId',
    'checkIn',
    'checkOut',
    'scanAt',
];

export enum TimekeepingOrderBy {
    DATE_SCAN = 'scanAt',
    USER_ID = 'userId',
    FULL_NAME = 'fullName',
}

export enum UserTimekeepingOrderBy {
    USER_ID = 'userId',
}

export const CREATE_USER_TIMEKEEPING_HISTORY_CRONJOB_BATCH_LIMIT = 10;
