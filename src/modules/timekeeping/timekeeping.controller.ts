import {
    Body,
    Controller,
    InternalServerErrorException,
    Post,
    Request,
    UseGuards,
    Get,
    Query,
    UseInterceptors,
    UploadedFile,
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
    readFingerDataFile,
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
import { FileInterceptor } from '@nestjs/platform-express';
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
import {
    HttpStatus,
    TIMEZONE_NAME_DEFAULT,
    WeekDay,
} from 'src/common/constants';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import { Timekeeping } from './entity/timekeeping.entity';
import { hasPermission } from 'src/common/helpers/common.function';
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
    ) {}

    @Get('dashboard')
    @Permissions([
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.READ}`,
    ])
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
                paidLeaveHours:
                    +userTimekeeping.timekeepingHistory?.paidLeaveHoursLeft +
                    userTimekeeping.paidLeaveHourThisMonth,
            };

            const lastYear = moment()
                .subtract(1, 'year')
                .tz(TIMEZONE_NAME_DEFAULT)
                .year();

            const [holidayList, lastYearTimekeepingHistory] = await Promise.all(
                [
                    this.holidayService.getHolidayList({ ...query }),
                    this.userTimekeepingHistoryService.getLatestTimekeepingHistory(
                        {
                            month: LastMonthOfTheYear,
                            year: lastYear,
                            userId: req?.loginUser?.id,
                        },
                    ),
                ],
            );
            const holidayDateList = holidayList?.items?.map((item) => {
                return item?.date?.toString();
            });

            let leaveHoursOfMonth = 0;
            let authorizedLeaveHoursOfMonth = 0;
            let workingHoursOfMonth = 0;
            let paidLeaveHoursLeft = 0;
            let workingHours = 0;
            paidLeaveHoursLeft = userWorkingInfo['paidLeaveHours'];
            forEach(userWorkingInfo.timkeepings, (timekeeping, date) => {
                const dayNumber = moment(date).day();
                if (
                    dayNumber !== WeekDay.SATURDAY &&
                    dayNumber !== WeekDay.SUNDAY &&
                    !holidayDateList.includes(date)
                ) {
                    if (
                        moment(date).isBefore(
                            moment(
                                moment()
                                    .tz(TIMEZONE_NAME_DEFAULT)
                                    .fmDayString(),
                            ),
                        )
                    ) {
                        leaveHoursOfMonth +=
                            (timekeeping?.unauthorizedLeaveHours || 0) +
                            (timekeeping?.authorizedLeaveHours || 0);
                        authorizedLeaveHoursOfMonth +=
                            timekeeping?.authorizedLeaveHours || 0;
                        workingHours += timekeeping?.workingHours || 0;
                    }
                    workingHoursOfMonth += WORKING_HOUR_PER_DAY;
                }
            });
            const paidLeaveHoursUsed = Math.min(
                paidLeaveHoursLeft,
                authorizedLeaveHoursOfMonth,
            );
            return new SuccessResponse({
                workingHours: round(workingHours, 2),
                workingHoursNeeded: workingHoursOfMonth,
                paidLeaveHoursUsed: round(paidLeaveHoursUsed, 2),
                unpaidLeaveHours: round(
                    leaveHoursOfMonth - paidLeaveHoursUsed,
                    2,
                ),
                authorizedLeaveHoursOfMonth: round(
                    authorizedLeaveHoursOfMonth,
                    2,
                ),
                paidLeaveHoursLeft: round(
                    paidLeaveHoursLeft - paidLeaveHoursUsed,
                    2,
                ),
                lastYearRemainingPaidLeaveHours:
                    lastYearTimekeepingHistory?.paidLeaveHoursLeft || 0,
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
            return new SuccessResponse({ items, totalItems });
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
            await this.databaseService.recordUserLogging({
                userId: req.loginUser?.id,
                route: req.route,
                oldValue: {},
                newValue: { ...newTimekeeping },
            });
            return new SuccessResponse(newTimekeeping);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('upload-finger-scanner-data')
    @Permissions([
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.CREATE}`,
    ])
    @UseInterceptors(FileInterceptor('file'))
    async upload(@Request() req, @UploadedFile() file) {
        try {
            const finalFileName = file?.originalname?.split('.');
            if (finalFileName[finalFileName.length - 1] !== dat) {
                const message = await this.i18n.translate(
                    'user.status.error.notAllow',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                        message,
                        key: 'originalname',
                    },
                ]);
            }

            const text = Buffer.from(file?.buffer).toString('utf-8');
            await readFingerDataFile(text);
            return new SuccessResponse();
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
            await this.databaseService.recordUserLogging({
                userId: req.loginUser?.id,
                route: req.route,
                oldValue: {},
                newValue: { ...updateTimekeeping },
            });
            return new SuccessResponse(updateTimekeeping);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('export')
    @Permissions([
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.CREATE}`,
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
            const holidayDateList = holidayList?.items?.map((item) => {
                return item?.date?.toString();
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
                if (holidayDateList.includes(item)) {
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
