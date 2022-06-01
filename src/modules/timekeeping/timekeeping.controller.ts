import {
    Body,
    Controller,
    InternalServerErrorException,
    Post,
    Request,
    UseGuards,
    Get,
    Query,
    Patch,
    Param,
    ParseIntPipe,
    Delete,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { JoiValidationPipe } from '../../common/pipes/joi.validation.pipe';
import { DatabaseService } from '../../common/services/database.service';
import * as ExcelJS from 'exceljs';
import {
    calculateActualWorkingHours,
    TimekeepingService,
} from './services/timekeeping.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import {
    ErrorResponse,
    SuccessResponse,
} from '../../common/helpers/api.response';
import {
    TimekeepingDashboardQueryStringDto,
    TimekeepingListQueryStringDto,
    ExportTimekeepingDto,
    TimekeepingDashboardQueryStringSchema,
    TimekeepingListQueryStringSchema,
} from './dto/requests/get-time-line-request.dto';
import {
    CreateTimekeepingSchema,
    ExportTimekeepingSchema,
    TimekeepingDto,
    UpdateTimekeepingSchema,
} from './dto/requests/create-time-line.dto';
import {
    AuthorizationGuard,
    Permissions,
} from 'src/common/guards/authorization.guard';
import {
    PermissionResources,
    PermissionActions,
} from 'src/modules/role/role.constants';
import { HttpStatus, TIMEZONE_NAME_DEFAULT } from 'src/common/constants';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import { Timekeeping } from './entity/timekeeping.entity';
import { hasPermission, isWeekend } from 'src/common/helpers/common.function';
import { IPermissionResponse } from '../role/role.interface';
import {
    ExportExcelService,
    getExcelHeader,
    getTimeKeepingData,
} from './services/export-excel.service';
import { HolidayService } from '../setting/services/holiday.service';
import forEach from 'lodash/forEach';
import { WORKING_HOUR_PER_DAY } from 'src/common/constants';
import moment from 'moment-timezone';
import { RequestAbsenceService } from '../request-absence/services/requestAbsence.service';
import { TrimObjectPipe } from 'src/common/pipes/trim.object.pipe';
import round from 'lodash/round';
import { UserService } from '../user/services/user.service';
import { UserStatus } from '../user/user.constant';
import { LastMonthOfTheYear, dat } from './timekeeping.constant';
import { UserTimekeepingHistoryService } from './services/userTimekeepingHistory.service';
import { SettingService } from '../setting/services/setting.service';

@Controller('timekeeping')
@UseGuards(JwtGuard, AuthorizationGuard)
export class TimekeepingController {
    constructor(
        private readonly timekeepingService: TimekeepingService,
        private readonly requestAbsenceService: RequestAbsenceService,
        private readonly i18n: I18nRequestScopeService,
        private readonly exportExcelService: ExportExcelService,
        private readonly holidayService: HolidayService,
        private readonly databaseService: DatabaseService,
        private readonly userService: UserService,
        private readonly userTimekeepingHistoryService: UserTimekeepingHistoryService,
        private readonly settingService: SettingService,
    ) {}

    @Get('dashboard')
    async getTimekeepingDashboard(
        @Request() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(TimekeepingDashboardQueryStringSchema),
        )
        query: TimekeepingDashboardQueryStringDto,
    ) {
        try {
            const { items } = await this.timekeepingService.getWorkingData({
                ...query,
                userIds: [req.loginUser.id],
            });

            if (!items.length) {
                const message = await this.i18n.t(
                    'timekeeping.common.error.doNotHaveDataForExcelExport',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message);
            }
            const userTimekeeping = items[0];
            forEach(userTimekeeping.timekeepings, (value, key) => {
                const workingInfo = calculateActualWorkingHours(value);

                Object.assign(userTimekeeping.timekeepings[key], {
                    ...workingInfo,
                });
            });
            const userWorkingInfo = {
                userId: userTimekeeping.id,
                fullName: userTimekeeping.fullName,
                position: userTimekeeping.position,
                timkeepings: userTimekeeping.timekeepings,
                paidLeaveHours: userTimekeeping.paidLeaveHourThisMonth,
            };

            const lastYear = moment()
                .subtract(1, 'year')
                .tz(TIMEZONE_NAME_DEFAULT)
                .year();
            const queryMonth =
                moment(query.startDate).tz(TIMEZONE_NAME_DEFAULT).month() + 1;
            const queryYear = moment(query.startDate)
                .tz(TIMEZONE_NAME_DEFAULT)
                .year();

            const [
                holidayList,
                lastYearTimekeepingHistory,
                resetPaidLeaveHoursDate,
                totalPaidLeaveHoursUsedThisYear,
            ] = await Promise.all([
                this.holidayService.getHolidayList({ ...query }),
                this.userTimekeepingHistoryService.getLatestTimekeepingHistory({
                    month: LastMonthOfTheYear,
                    year: lastYear,
                    userId: req?.loginUser?.id,
                }),
                this.settingService.getResetPaidLeaveDay(),
                this.userTimekeepingHistoryService.getTotalPaidLeaveHoursUsed(
                    req?.loginUser?.id,
                    queryYear,
                    queryMonth,
                ),
            ]);
            const holidayDateList = new Map<string, boolean>();
            holidayList?.items?.forEach((holiday) => {
                holidayDateList.set(
                    moment(holiday.date)
                        .tz(TIMEZONE_NAME_DEFAULT)
                        .fmDayString(),
                    true,
                );
            });

            let leaveHoursOfMonth = 0;
            let authorizedLeaveHoursOfMonth = 0;
            let workingHoursOfMonth = 0;
            let paidLeaveHoursLeft = 0;
            let workingHours = 0;
            let holidayPaidLeaveHours = 0;
            paidLeaveHoursLeft = userWorkingInfo['paidLeaveHours'];
            forEach(userWorkingInfo.timkeepings, (timekeeping, date) => {
                if (!isWeekend(date)) {
                    workingHoursOfMonth += WORKING_HOUR_PER_DAY;
                }
                if (
                    moment(date).isSameOrAfter(
                        moment(
                            moment().tz(TIMEZONE_NAME_DEFAULT).fmDayString(),
                        ),
                    )
                ) {
                    return;
                }
                if (isWeekend(date)) {
                    workingHours += timekeeping?.workingHours || 0;
                    return;
                }
                if (holidayDateList.has(date)) {
                    holidayPaidLeaveHours += WORKING_HOUR_PER_DAY;
                } else {
                    leaveHoursOfMonth +=
                        (timekeeping?.unauthorizedLeaveHours || 0) +
                        (timekeeping?.authorizedLeaveHours || 0);
                    authorizedLeaveHoursOfMonth +=
                        timekeeping?.authorizedLeaveHours || 0;
                }
                workingHours += timekeeping?.workingHours || 0;
            });
            const paidLeaveHoursUsed = Math.min(
                paidLeaveHoursLeft,
                authorizedLeaveHoursOfMonth,
            );
            let lastYearRemainingPaidLeaveHours =
                (lastYearTimekeepingHistory?.paidLeaveHoursLeft || 0) -
                totalPaidLeaveHoursUsedThisYear;
            if (
                moment(query.startDate)
                    .tz(TIMEZONE_NAME_DEFAULT)
                    .startOf('month')
                    .isSameOrAfter(
                        moment(resetPaidLeaveHoursDate)
                            .tz(TIMEZONE_NAME_DEFAULT)
                            .add(1, 'month')
                            .startOf('month'),
                    )
            ) {
                lastYearRemainingPaidLeaveHours = 0;
            }
            if (queryMonth === moment().tz(TIMEZONE_NAME_DEFAULT).month() + 1) {
                lastYearRemainingPaidLeaveHours -= authorizedLeaveHoursOfMonth;
            }
            return new SuccessResponse({
                workingHours: round(workingHours, 1),
                workingHoursNeeded: workingHoursOfMonth,
                authorizedLeaveHoursOfMonth: round(
                    paidLeaveHoursUsed + holidayPaidLeaveHours,
                    1,
                ),
                unpaidLeaveHours: round(
                    leaveHoursOfMonth - paidLeaveHoursUsed,
                    1,
                ),
                paidLeaveHoursLeft: round(
                    paidLeaveHoursLeft - paidLeaveHoursUsed,
                    1,
                ),
                lastYearRemainingPaidLeaveHours: Math.max(
                    0,
                    round(lastYearRemainingPaidLeaveHours, 1),
                ),
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get()
    @Permissions([
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.READ}`,
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.READ_PERSONAL}`,
    ])
    async getTimekeepingList(
        @Request() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(TimekeepingListQueryStringSchema),
        )
        query: TimekeepingListQueryStringDto,
    ) {
        try {
            const permissions = req.loginUser.role
                ?.permissions as IPermissionResponse[];
            if (
                !hasPermission(
                    permissions,
                    PermissionResources.TIMEKEEPING,
                    PermissionActions.READ,
                )
            ) {
                query.userIds = [req.loginUser.id];
            }
            const { items, totalItems } =
                await this.timekeepingService.getWorkingData(query);
            return new SuccessResponse({
                items: items.map((userTimekeeping) => {
                    forEach(userTimekeeping.timekeepings, (value, key) => {
                        const workingInfo = calculateActualWorkingHours({
                            ...value,
                        });

                        Object.assign(userTimekeeping.timekeepings[key], {
                            authorizedLeaveHours:
                                workingInfo.authorizedLeaveHours,
                            workingHours: workingInfo.workingHours,
                        });
                    });
                    return userTimekeeping;
                }),
                totalItems,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':id')
    @Permissions([
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.READ}`,
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.READ_PERSONAL}`,
    ])
    async getTimekeepingDetail(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
    ) {
        try {
            const timekeeping =
                await this.timekeepingService.getTimekeepingById(id);
            if (!timekeeping) {
                const message = await this.i18n.translate(
                    'timekeeping.common.error.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const permissions = req.loginUser.role
                ?.permissions as IPermissionResponse[];
            if (
                !hasPermission(
                    permissions,
                    PermissionResources.TIMEKEEPING,
                    PermissionActions.READ,
                ) &&
                timekeeping.userId !== req.loginUser?.id
            ) {
                const message = await this.i18n.translate(
                    'timekeeping.common.error.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            return new SuccessResponse(timekeeping);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post()
    @Permissions([
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.CREATE}`,
    ])
    async createTimekeeping(
        @Request() req,
        @Body(
            new TrimObjectPipe(),
            new JoiValidationPipe(CreateTimekeepingSchema),
        )
        body: TimekeepingDto,
    ) {
        try {
            const { checkIn, checkOut, userId } = body;
            const user = await this.userService.getUserById(userId);
            if (!user) {
                const message = await this.i18n.translate(
                    'user.common.error.user.notFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message,
                        key: 'userId',
                    },
                ]);
            } else if (user.status !== UserStatus.ACTIVE) {
                const message = await this.i18n.t(
                    'timekeeping.common.error.notActiveUser',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'userId',
                        message,
                        errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                    },
                ]);
            }
            const checkTimeOverlap =
                await this.requestAbsenceService.checkTimeOverlap(
                    userId,
                    checkIn,
                    checkOut,
                );
            if (!checkTimeOverlap) {
                const message = await this.i18n.translate(
                    'timekeeping.common.error.timekeeping',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'startTime',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }
            const newTimekeeping =
                await this.timekeepingService.createTimekeeping(body);
            return new SuccessResponse(newTimekeeping);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    @Permissions([
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.UPDATE}`,
    ])
    async updateTimekeeping(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body(
            new TrimObjectPipe(),
            new JoiValidationPipe(UpdateTimekeepingSchema),
        )
        body: TimekeepingDto,
    ) {
        try {
            const timekeeping = await this.databaseService.getDataById(
                Timekeeping,
                id,
            );
            if (!timekeeping) {
                const message = await this.i18n.translate(
                    'timekeeping.common.error.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const checkTimeOverlap =
                await this.requestAbsenceService.checkTimeOverlap(
                    timekeeping.userId,
                    body.checkIn,
                    body.checkOut,
                );
            if (!checkTimeOverlap) {
                const message = await this.i18n.translate(
                    'timekeeping.common.error.timekeeping',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'startTime',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }
            const updateTimekeeping =
                await this.timekeepingService.updateTimekeeping(id, body);
            return new SuccessResponse(updateTimekeeping);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('export')
    @Permissions([
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.READ}`,
    ])
    async exportData(
        @Request() req,
        @Body(new JoiValidationPipe(ExportTimekeepingSchema))
        body: ExportTimekeepingDto,
    ) {
        try {
            const permissions = req.loginUser.role
                ?.permissions as IPermissionResponse[];
            if (
                !hasPermission(
                    permissions,
                    PermissionResources.TIMEKEEPING,
                    PermissionActions.READ,
                )
            ) {
                body.userIds = [req.loginUser?.id];
            }
            const { startDate, endDate } = body;
            let { userIds = [] } = body;
            if (userIds.length) {
                const checkListUsersExisted =
                    await this.exportExcelService.checkListUsersExisted(
                        userIds,
                    );
                if (!checkListUsersExisted) {
                    const message = await this.i18n.t(
                        'timekeeping.common.error.userIdsNotExist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'userIds',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
            } else {
                userIds = await this.userService.getAllUserIds();
            }
            // prepare data for excel export
            const getMonth =
                moment(startDate).tz(TIMEZONE_NAME_DEFAULT).month() + 1;
            const getYear = moment(startDate).tz(TIMEZONE_NAME_DEFAULT).year();
            const daysInMonth = new Date(getYear, getMonth, 0).getDate();
            const holidayList = await this.holidayService.getHolidayList({
                startDate,
                endDate,
            });
            const holidayDateList = new Map<string, boolean>();
            holidayList?.items?.forEach((holiday) => {
                holidayDateList.set(
                    moment(holiday.date)
                        .tz(TIMEZONE_NAME_DEFAULT)
                        .fmDayString(),
                    true,
                );
            });

            let exportData = [];
            let processedCount = 0;
            while (processedCount < userIds.length) {
                const selectedUsers = userIds.slice(
                    processedCount,
                    processedCount +
                        Math.min(10, userIds.length - processedCount),
                );
                const { items } = await this.timekeepingService.getWorkingData({
                    ...body,
                    userIds: selectedUsers,
                });
                exportData = exportData.concat(items);
                processedCount += selectedUsers.length;
            }

            if (!exportData.length) {
                const message = await this.i18n.t(
                    'timekeeping.common.error.doNotHaveDataForExcelExport',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message);
            }
            const excelData = exportData.map((item) => {
                forEach(item?.timekeepings, (value, key) => {
                    const workingInfo = calculateActualWorkingHours(value);
                    Object.assign(item.timekeepings[key], {
                        ...workingInfo,
                    });
                });
                return {
                    userId: item.id,
                    fullName: item.fullName,
                    position: item.position,
                    ...item.timekeepings,
                    paidLeaveHours:
                        item.timekeepingHistory?.paidLeaveHoursLeft || 0,
                };
            });

            // excel export
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet(getMonth.toString());
            const holidayIndexes = [];
            const weekendIndexes = [];
            Object.keys(excelData[0]).map((item, index) => {
                if (holidayDateList.has(moment(item).fmDayString())) {
                    holidayIndexes.push((index + 1).toString());
                }
                if (
                    new Date(item).getDay() === 0 ||
                    new Date(item).getDay() === 6
                ) {
                    weekendIndexes.push((index + 1).toString());
                }
            });
            await getExcelHeader(ws, getMonth, getYear, daysInMonth);
            await getTimeKeepingData(
                ws,
                excelData,
                daysInMonth,
                holidayDateList,
                holidayIndexes,
                weekendIndexes,
            );
            const buf =
                (await wb.xlsx.writeBuffer()) as Partial<ExcelJS.XlsxWriteOptions>;
            const fileName = `${getYear}-${getMonth}.xlsx`;
            wb.xlsx.writeFile(`./exportData/${fileName}`, buf);
            // end of excel export
            return new SuccessResponse({ fileName });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':id')
    @Permissions([
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.DELETE}`,
    ])
    async deleteTimekeeping(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
    ) {
        try {
            const timekeepingExists =
                await this.timekeepingService.checkIdExists(id);
            if (!timekeepingExists) {
                const message = await this.i18n.translate(
                    'timekeeping.common.error.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            await this.timekeepingService.deleteTimekeeping(
                id,
                req.loginUser?.id,
            );
            const message = await this.i18n.translate(
                'timekeeping.message.deleteSuccess',
            );

            return new SuccessResponse({ id }, message);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
