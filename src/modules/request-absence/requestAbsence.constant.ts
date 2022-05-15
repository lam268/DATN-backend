export enum RequestAbsenceStatus {
    WAITING = 'waiting',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export const requestAbsenceAttributes = [
    'requestAbsence.id',
    'requestAbsence.userId',
    'requestAbsence.reason',
    'requestAbsence.status',
    'requestAbsence.startAt',
    'requestAbsence.endAt',
    'requestAbsence.createdAt',
    'requestAbsence.updatedAt',
    'user.fullName',
    'user.id',
    'user.avatarId',
    'file.fileName',
];

export enum RequestAbsenceOrderBy {
    CREATED_AT = 'createdAt',
    FULL_NAME = 'fullName',
    START_AT = 'startAt',
    END_AT = 'endAt',
}

export const RequestAbsenceDurationCondition = [
    {
        min: 0,
        max: 4,
        requiredMinimumDuration: 1,
    },
    {
        min: 4,
        max: 24,
        requiredMinimumDuration: 24,
    },
    {
        min: 24,
        requiredMinimumDuration: 48,
    },
];
