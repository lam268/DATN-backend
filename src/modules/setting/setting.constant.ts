import { GeneralSettings } from '../common/entity/general-settings.entity';

// for general setting
export enum SettingKey {
    USER_POSITION = 'user_position',
    PAID_LEAVE_DAYS_RESET_SCHEDULE = 'paid_leave_days_reset_schedule',
}

export enum ContractTypeOrderBy {
    NAME = 'name',
    CREATEDAT = 'createdAt',
}

export const settingListAtttributes: (keyof GeneralSettings)[] = [
    'id',
    'key',
    'values',
];
export const positionListAtttributes = ['id', 'name'];

// for holiday setting
export const MAX_EVENT_PER_DAY = 1;
export const holidayListAttributes = ['id', 'title', 'description', 'date'];

export const DEFAULT_LIMIT_FOR_HOLIDAY = 31;
