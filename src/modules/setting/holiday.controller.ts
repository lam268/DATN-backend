import {
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import {
    ErrorResponse,
    SuccessResponse,
} from '../../common/helpers/api.response';
import { JoiValidationPipe } from '../../common/pipes/joi.validation.pipe';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { HolidayService } from './services/holiday.service';
import {
    HolidayDto,
    holidaySchema,
    HolidayListQueryStringDto,
    holidayListQueryStringSchema,
} from './dto/request/holiday.dto';
import { MAX_EVENT_PER_DAY } from './setting.constant';
import { HttpStatus } from 'src/common/constants';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import {
    AuthorizationGuard,
    Permissions,
} from 'src/common/guards/authorization.guard';
import { PermissionActions, PermissionResources } from '../role/role.constants';
import { TrimObjectPipe } from 'src/common/pipes/trim.object.pipe';

@Controller('/setting/holiday')
@UseGuards(JwtGuard, AuthorizationGuard)
export class HolidayController {
    constructor(
        private readonly holidayService: HolidayService,
        private readonly i18n: I18nRequestScopeService,
    ) {}

    @Get()
    @Permissions([
        `${PermissionResources.SETTING}_${PermissionActions.READ}`,
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.READ}`,
        `${PermissionResources.TIMEKEEPING}_${PermissionActions.READ_PERSONAL}`,
    ])
    async getHolidayList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(holidayListQueryStringSchema),
        )
        query: HolidayListQueryStringDto,
    ) {
        try {
            const listSettingHoliday = await this.holidayService.getHolidayList(
                query,
            );

            return new SuccessResponse(listSettingHoliday);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':id')
    @Permissions([`${PermissionResources.SETTING}_${PermissionActions.READ}`])
    async getHolidayDetail(@Param('id', ParseIntPipe) id: number) {
        try {
            const holiday = await this.holidayService.getHolidayById(id);
            if (!holiday) {
                const message = await this.i18n.translate(
                    'setting.holiday.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(holiday);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post()
    @Permissions([`${PermissionResources.SETTING}_${PermissionActions.UPDATE}`])
    async createHoliday(
        @Request() req,
        @Body(new TrimObjectPipe(), new JoiValidationPipe(holidaySchema))
        data: HolidayDto,
    ) {
        try {
            const totalHolidaysInThisDate =
                await this.holidayService.countHolidayByDate(data.date);
            if (totalHolidaysInThisDate >= MAX_EVENT_PER_DAY) {
                const message = await this.i18n.t('setting.holiday.duplicate');
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'date',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }
            const insertHoliday = {
                ...data,
                createdBy: req.loginUser.id,
            };
            const holiday = await this.holidayService.createHoliday(
                insertHoliday,
            );
            return new SuccessResponse(holiday);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    @Permissions([`${PermissionResources.SETTING}_${PermissionActions.UPDATE}`])
    async updateHoliday(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body(new TrimObjectPipe(), new JoiValidationPipe(holidaySchema))
        data: HolidayDto,
    ) {
        try {
            const holidayExists = await this.holidayService.checkIdExists(id);
            if (!holidayExists) {
                const message = await this.i18n.translate(
                    'setting.holiday.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const totalHolidaysInThisDate =
                await this.holidayService.countHolidayByDate(data.date, id);
            if (totalHolidaysInThisDate + 1 > MAX_EVENT_PER_DAY) {
                const message = await this.i18n.t('setting.holiday.duplicate');
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'date',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }
            const updateHoliday = {
                ...data,
                updatedBy: req.loginUser.id,
            };
            const updatedHoliday = await this.holidayService.updateHoliday(
                id,
                updateHoliday,
            );
            return new SuccessResponse(updatedHoliday);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':id')
    @Permissions([`${PermissionResources.SETTING}_${PermissionActions.UPDATE}`])
    async deleteHoliday(@Request() req, @Param('id', ParseIntPipe) id: number) {
        try {
            const holidayExists = await this.holidayService.checkIdExists(id);
            if (!holidayExists) {
                const message = await this.i18n.translate(
                    'setting.holiday.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            await this.holidayService.deleteHoliday(id, req.loginUser.id);
            const message = await this.i18n.translate(
                'setting.holiday.removeSuccess',
            );

            return new SuccessResponse({ id }, message);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
