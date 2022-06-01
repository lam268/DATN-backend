import {
    Body,
    Controller,
    InternalServerErrorException,
    Param,
    Patch,
    Post,
    Request,
    UseGuards,
    Get,
    Query,
    Delete,
    ParseIntPipe,
} from '@nestjs/common';
import moment from 'moment';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { JoiValidationPipe } from '../../common/pipes/joi.validation.pipe';
import { DatabaseService } from '../../common/services/database.service';
import { CreateRequestAbsenceDto } from './dto/requests/create-request-absence.dto';
import { RequestAbsenceResponse } from './dto/responses/api-response.dto';
import { RequestAbsenceService } from './services/requestAbsence.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { UpdateRequestAbsenceDto } from './dto/requests/update-request-absence.dto';
import {
    ErrorResponse,
    SuccessResponse,
} from '../../common/helpers/api.response';
import { User } from '../user/entity/user.entity';
import { RequestAbsence } from './entity/request-absences.entity';
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
    MAX_INTEGER,
    MINUTES_PER_HOUR,
} from 'src/common/constants';
import { hasPermission } from 'src/common/helpers/common.function';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import { IPermissionResponse } from '../role/role.interface';
import {
    CreateRequestAbsenceSchema,
    RequestAbasenceStatusSchema,
    RequestAbsenceListQueryStringDto,
    RequestAbsenceListQueryStringSchema,
    UpdateRequestAbsenceSchema,
} from './dto/requests/get-request-absences-request.dto';
import { TrimObjectPipe } from 'src/common/pipes/trim.object.pipe';
import { RequestAbsenceDurationCondition } from './requestAbsence.constant';
import { UserService } from '../user/services/user.service';
import { UserStatus } from '../user/user.constant';

@Controller('request-absence')
@UseGuards(JwtGuard, AuthorizationGuard)
export class RequestAbsenceController {
    constructor(
        private readonly requestAbsenceService: RequestAbsenceService,
        private readonly i18n: I18nRequestScopeService,
        private readonly databaseService: DatabaseService,
        private readonly userService: UserService,
    ) {}

    @Get()
    @Permissions([
        `${PermissionResources.REQUEST_ABSENCE}_${PermissionActions.READ}`,
        `${PermissionResources.REQUEST_ABSENCE}_${PermissionActions.READ_PERSONAL}`,
    ])
    async getRequestAbsences(
        @Request() req,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(RequestAbsenceListQueryStringSchema),
        )
        query: RequestAbsenceListQueryStringDto,
    ) {
        try {
            const permissions = req.loginUser.role
                ?.permissions as IPermissionResponse[];
            if (
                !hasPermission(
                    permissions,
                    PermissionResources.REQUEST_ABSENCE,
                    PermissionActions.READ,
                )
            ) {
                query.userIds = [req.loginUser?.id];
            }
            const { items, totalItems }: RequestAbsenceResponse =
                await this.requestAbsenceService.getRequestAbsences(query);
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':id')
    @Permissions([
        `${PermissionResources.REQUEST_ABSENCE}_${PermissionActions.READ}`,
        `${PermissionResources.REQUEST_ABSENCE}_${PermissionActions.READ_PERSONAL}`,
    ])
    async getRequestAbsenceDetail(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
    ) {
        try {
            const requestAbsence =
                await this.requestAbsenceService.getRequestAbsenceById(id);
            if (!requestAbsence) {
                const message = await this.i18n.translate(
                    'request-absence.common.notFound',
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
                    PermissionResources.REQUEST_ABSENCE,
                    PermissionActions.READ,
                ) &&
                requestAbsence.userId !== req.loginUser?.id
            ) {
                const message = await this.i18n.translate(
                    'request-absence.common.error.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            return new SuccessResponse(requestAbsence);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post()
    @Permissions([
        `${PermissionResources.REQUEST_ABSENCE}_${PermissionActions.CREATE}`,
        `${PermissionResources.REQUEST_ABSENCE}_${PermissionActions.CREATE_PERSONAL}`,
    ])
    async createRequestAbsence(
        @Request() req,
        @Body(
            new TrimObjectPipe(),
            new JoiValidationPipe(CreateRequestAbsenceSchema),
        )
        body: CreateRequestAbsenceDto,
    ) {
        try {
            const { startAt, endAt, userId } = body;
            const permissions = req.loginUser.role
                ?.permissions as IPermissionResponse[];
            if (
                !hasPermission(
                    permissions,
                    PermissionResources.REQUEST_ABSENCE,
                    PermissionActions.CREATE,
                )
            ) {
                if (userId !== req.loginUser?.id) {
                    const message = await this.i18n.translate(
                        'request-absence.common.error.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
                if (
                    moment().startOfDay().isAfter(moment(startAt).startOfDay())
                ) {
                    const message = await this.i18n.translate(
                        'request-absence.common.error.insufficientPermission',
                    );
                    return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
                }
            }

            const user = await this.userService.getUserById(userId);
            if (!user) {
                const message = await this.i18n.translate(
                    'user.common.error.user.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            } else if (user.status !== UserStatus.ACTIVE) {
                const message = await this.i18n.t(
                    'request-absence.common.error.notActiveUser',
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
                    startAt,
                    endAt,
                );
            if (!checkTimeOverlap) {
                const message = await this.i18n.translate(
                    'request-absence.common.error.existRequest',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'startAt',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }
            if (
                !hasPermission(
                    permissions,
                    PermissionResources.REQUEST_ABSENCE,
                    PermissionActions.CREATE,
                )
            ) {
                const restTime = moment(startAt).diff(moment(), 'hour');
                const requestAbsenceDuration =
                    moment(endAt).diff(moment(startAt), 'minute') /
                    MINUTES_PER_HOUR;
                const requestAbsenceCondition =
                    RequestAbsenceDurationCondition.find((condition) => {
                        return (
                            (condition?.min || 0) < requestAbsenceDuration &&
                            requestAbsenceDuration <=
                                (condition?.max || MAX_INTEGER)
                        );
                    });
                if (
                    requestAbsenceCondition &&
                    restTime < requestAbsenceCondition.requiredMinimumDuration
                ) {
                    const message = await this.i18n.translate(
                        'request-absence.common.error.invalid',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'endAt',
                            message,
                            errorCode: HttpStatus.OVER_LIMIT,
                        },
                    ]);
                }
            }
            const newRequestAbsenes =
                await this.requestAbsenceService.createRequestAbsence({
                    ...body,
                    createdBy: req?.loginUser?.id,
                });
            return new SuccessResponse(newRequestAbsenes);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    @Permissions([
        `${PermissionResources.REQUEST_ABSENCE}_${PermissionActions.UPDATE}`,
        `${PermissionResources.REQUEST_ABSENCE}_${PermissionActions.UPDATE_PERSONAL}`,
    ])
    async updateRequestAbsence(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
        @Body(
            new TrimObjectPipe(),
            new JoiValidationPipe(UpdateRequestAbsenceSchema),
        )
        body: UpdateRequestAbsenceDto,
    ) {
        try {
            const { startAt, endAt, userId } = body;

            const user = await this.userService.getUserById(userId);
            if (!user) {
                const message = await this.i18n.translate(
                    'user.common.error.user.notFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'userId',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            } else if (user.status !== UserStatus.ACTIVE) {
                const message = await this.i18n.t(
                    'request-absence.common.error.notActiveUser',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'userId',
                        message,
                        errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                    },
                ]);
            }

            const requestAbsence = await this.databaseService.getDataById(
                RequestAbsence,
                id,
            );
            if (!requestAbsence) {
                const message = await this.i18n.translate(
                    'request-absence.common.error.notFound',
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
                    PermissionResources.REQUEST_ABSENCE,
                    PermissionActions.UPDATE,
                ) &&
                (userId !== req.loginUser?.id ||
                    requestAbsence.userId !== req.loginUser?.id)
            ) {
                const message = await this.i18n.translate(
                    'request-absence.common.error.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            const checkTimeOverlap =
                await this.requestAbsenceService.checkTimeOverlap(
                    userId,
                    startAt,
                    endAt,
                    requestAbsence.id,
                );
            if (!checkTimeOverlap) {
                const message = await this.i18n.translate(
                    'request-absence.common.error.existRequest',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'startAt',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }
            if (
                !hasPermission(
                    permissions,
                    PermissionResources.REQUEST_ABSENCE,
                    PermissionActions.CREATE,
                )
            ) {
                const restTime = moment(startAt).diff(moment(), 'hour');
                const requestAbsenceDuration =
                    moment(endAt).diff(moment(startAt), 'minute') /
                    MINUTES_PER_HOUR;
                const requestAbsenceCondition =
                    RequestAbsenceDurationCondition.find((condition) => {
                        return (
                            (condition?.min || 0) < requestAbsenceDuration &&
                            requestAbsenceDuration <=
                                (condition?.max || MAX_INTEGER)
                        );
                    });
                if (
                    requestAbsenceCondition &&
                    restTime < requestAbsenceCondition.requiredMinimumDuration
                ) {
                    const message = await this.i18n.translate(
                        'request-absence.common.error.invalid',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'endAt',
                            message,
                            errorCode: HttpStatus.OVER_LIMIT,
                        },
                    ]);
                }
            }

            const updateRequestAbsence =
                await this.requestAbsenceService.updateRequestAbsence(id, body);
            return new SuccessResponse(updateRequestAbsence);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id/status')
    @Permissions([
        `${PermissionResources.REQUEST_ABSENCE}_${PermissionActions.UPDATE_STATUS}`,
    ])
    async updateRequestAbsenceStatus(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body(
            new TrimObjectPipe(),
            new JoiValidationPipe(RequestAbasenceStatusSchema),
        )
        data: UpdateRequestAbsenceDto,
    ) {
        try {
            const requestAbsence = await this.databaseService.getDataById(
                RequestAbsence,
                id,
            );
            if (!requestAbsence) {
                const message = await this.i18n.translate(
                    'request-absence.common.error.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const user = await this.databaseService.getDataById(
                User,
                requestAbsence.userId,
            );
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
            }

            const savedRequestAbsence =
                await this.requestAbsenceService.updateRequestAbsence(id, data);
            return new SuccessResponse(savedRequestAbsence);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':id')
    @Permissions([
        `${PermissionResources.REQUEST_ABSENCE}_${PermissionActions.DELETE}`,
        `${PermissionResources.REQUEST_ABSENCE}_${PermissionActions.DELETE_PERSONAL}`,
    ])
    async deleteRequestAbsence(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
    ) {
        try {
            const requestAbsence = await this.databaseService.getDataById(
                RequestAbsence,
                id,
            );
            if (!requestAbsence) {
                const message = await this.i18n.translate(
                    'request-absence.common.error.notFound',
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
                    PermissionResources.REQUEST_ABSENCE,
                    PermissionActions.DELETE,
                ) &&
                requestAbsence.userId !== req.loginUser?.id
            ) {
                const message = await this.i18n.translate(
                    'request-absence.common.error.insufficientPermission',
                );
                return new ErrorResponse(HttpStatus.FORBIDDEN, message, []);
            }
            await this.requestAbsenceService.deleteRequestAbsence(
                id,
                req.loginUser?.id,
            );
            return new SuccessResponse({ id });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
