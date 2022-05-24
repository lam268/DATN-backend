import { TableColumnOptions } from 'typeorm';

export enum TABLE_NAME {
    Users = 'users',
    Files = 'files',
    GeneralSettings = 'general_settings',
    DeviceTypes = 'device_types',
    Roles = 'roles',
    Provinces = 'provinces',
    User_Tokens = 'user_tokens',
    Contracts = 'contracts',
    Timekeeping = 'timekeepings',
    RequestAbsences = 'request_absences',
    FingerScan = 'finger_scanner_data',
    UserPosition = 'user_position',
    Bank = 'banks',
    ContractTypes = 'contract_types',
    SettingHoliday = 'setting_holidays',
    PermissionActions = 'permission_actions',
    Permissions = 'permissions',
    PermissionResources = 'permission_resources',
    RolePermissions = 'role_permissions',
    UserTimekeepingHistory = 'user_timekeeping_histories',
}

export const commonColumns: TableColumnOptions[] = [
    {
        name: 'id',
        type: 'int',
        isPrimary: true,
        isGenerated: true,
        generationStrategy: 'increment',
    },
    {
        name: 'createdAt',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
        isNullable: true,
    },
    {
        name: 'updatedAt',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
        isNullable: true,
    },
    {
        name: 'deletedAt',
        type: 'timestamp',
        isNullable: true,
    },
    {
        name: 'createdBy',
        type: 'int',
        isNullable: true,
    },
    {
        name: 'updatedBy',
        type: 'int',
        isNullable: true,
    },
    {
        name: 'deletedBy',
        type: 'int',
        isNullable: true,
    },
];

export enum DBPermissionActions {
    READ = 'read',
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LOGIN = 'login',
    CREATE_PERSONAL = 'create_personal',
    READ_PERSONAL = 'read_personal',
    UPDATE_PERSONAL = 'update_personal',
    DELETE_PERSONAL = 'delete_personal',
    HR_ROLE = 'hr_role',
    UPDATE_STATUS = 'update_status',
    UPDATE_ROLE = 'update_role',
}

export enum DBPermissionResources {
    USER = 'user',
    CONTRACT = 'contract',
    TIMEKEEPING = 'timekeeping',
    REQUEST_ABSENCE = 'request_absence',
    SETTING = 'setting',
}
