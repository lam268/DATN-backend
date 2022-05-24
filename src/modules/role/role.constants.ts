export const roleAttributesList = [
    'role.id',
    'role.name',
    'role.description',
    'rolePermission.permissionId',
];

export enum ModuleName {
    USER = 'user',
    CONTRACT = 'contract',
    TIMEKEEPING = 'timekeeping',
    ROLE = 'role',
    REQUEST_ABSENCE = 'requestAbsence',
    CONTRACT_TYPE = 'contractType',
}

export enum PermissionResources {
    USER = 'user',
    CONTRACT = 'contract',
    TIMEKEEPING = 'timekeeping',
    REQUEST_ABSENCE = 'request_absence',
    ROLE = 'role',
    SETTING = 'setting',
}

export enum PermissionActions {
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
