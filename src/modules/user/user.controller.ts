import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    InternalServerErrorException,
    Query,
    ParseIntPipe,
    UseInterceptors,
    UploadedFile,
    Request,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';

import { UserService } from './services/user.service';
import {
    CreateUserDto,
    CreateUserSchema,
} from './dto/requests/create-user.dto';
import {
    UpdateUserDto,
    UpdateUserSchema,
} from './dto/requests/update-user.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { UserList } from './dto/response/api-response.dto';
import { DatabaseService } from '../../common/services/database.service';
import { User } from './entity/user.entity';
import {
    UserListQueryStringDto,
    UserListQueryStringSchema,
} from './dto/requests/list-user.dto';
import { JoiValidationPipe } from '../../common/pipes/joi.validation.pipe';
import {
    UserStatusDto,
    UserStatusSchema,
} from './dto/requests/common-user.dto';
import { AllowUpdateStatus, excel, UserStatus } from './user.constant';
import {
    ErrorResponse,
    SuccessResponse,
} from '../../common/helpers/api.response';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractService } from '../contract/services/contract.service';
import { ContractStatus } from '../contract/contract.constant';
import {
    AuthorizationGuard,
    Permissions,
} from 'src/common/guards/authorization.guard';
import {
    PermissionResources,
    PermissionActions,
} from 'src/modules/role/role.constants';
import { userPositionList } from 'src/modules/common/services/global-data.service';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import { HttpStatus } from 'src/common/constants';
import { Role } from '../role/entity/role.entity';
import { TrimObjectPipe } from 'src/common/pipes/trim.object.pipe';
import { Province } from './entity/province.entity';
import uniq from 'lodash/uniq';
import { ImportUserService } from './services/user.import.service';

@Controller('user')
@UseGuards(JwtGuard, AuthorizationGuard)
export class UserController {
    constructor(
        private readonly usersService: UserService,
        private readonly i18n: I18nRequestScopeService,
        private readonly databaseService: DatabaseService,
        private readonly contractService: ContractService,
        private readonly importUserService: ImportUserService,
    ) {}

    @Get()
    @Permissions([`${PermissionResources.USER}_${PermissionActions.READ}`])
    async getUsers(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(UserListQueryStringSchema),
        )
        query: UserListQueryStringDto,
    ) {
        try {
            const data: UserList = await this.usersService.getUsers(query);
            return new SuccessResponse(data);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':id')
    @Permissions([`${PermissionResources.USER}_${PermissionActions.READ}`])
    async getUser(@Param('id', ParseIntPipe) id: number) {
        try {
            const user = await this.usersService.getUserById(id);
            if (!user) {
                const message = await this.i18n.translate(
                    'user.common.error.user.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(user);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post()
    @Permissions([`${PermissionResources.USER}_${PermissionActions.CREATE}`])
    async create(
        @Request() req,
        @Body(new TrimObjectPipe(), new JoiValidationPipe(CreateUserSchema))
        data: CreateUserDto,
    ) {
        try {
            if (data.socialInsurance) {
                if (
                    await this.databaseService.checkItemExist(
                        User,
                        'socialInsurance',
                        data.socialInsurance,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'user.common.error.socialInsurance.exist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'socialInsurance',
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                            message: message,
                        },
                    ]);
                }
            }
            if (data.taxCode) {
                if (
                    await this.databaseService.checkItemExist(
                        User,
                        'taxCode',
                        data.taxCode,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'user.common.error.taxCode.exist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'taxCode',
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                            message: message,
                        },
                    ]);
                }
            }
            const promises = [
                this.databaseService.checkItemExist(User, 'email', data.email),
                this.databaseService.checkItemExist(Role, 'id', data.roleId),
                this.databaseService.checkItemExist(
                    User,
                    'bankAccount',
                    data.bankAccount,
                ),
                this.databaseService.checkItemExist(
                    User,
                    'citizenId',
                    data.citizenId,
                ),
                (userPositionList || [])
                    .map((u) => u?.code)
                    .includes(data.position),
                this.databaseService.checkItemExist(
                    Province,
                    'id',
                    data.provinceId,
                ),
            ];

            const [user, role, bankAccount, citizenId, position, province] =
                await Promise.all(promises);

            if (user) {
                const message = await this.i18n.translate(
                    'user.common.error.email.exist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'email',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message: message,
                    },
                ]);
            }
            if (!role) {
                const message = await this.i18n.translate(
                    'role.common.error.role.notFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'roleId',
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message: message,
                    },
                ]);
            }
            if (bankAccount) {
                const message = await this.i18n.translate(
                    'user.common.error.bankAccount.exist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'bankAccount',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message: message,
                    },
                ]);
            }
            if (citizenId) {
                const message = await this.i18n.translate(
                    'user.common.error.citizenId.exist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'citizenId',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message: message,
                    },
                ]);
            }

            if (data.position && !position) {
                const message = await this.i18n.translate(
                    'user.common.error.positionId.notExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'position',
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message: message,
                    },
                ]);
            }

            if (!province) {
                const message = await this.i18n.translate(
                    'user.common.error.provinceId.notExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'provinceId',
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message: message,
                    },
                ]);
            }

            const newUser = await this.usersService.createUser(data);
            return new SuccessResponse(newUser);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    @Permissions([`${PermissionResources.USER}_${PermissionActions.UPDATE}`])
    async updateUser(
        @Request() req,
        @Param('id') id: number,
        @Body(new TrimObjectPipe(), new JoiValidationPipe(UpdateUserSchema))
        data: UpdateUserDto,
    ) {
        try {
            const currentUser = await this.usersService.getUserById(id);

            if (!currentUser) {
                const message = await this.i18n.translate(
                    'user.common.error.user.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            if (data.socialInsurance) {
                if (
                    await this.databaseService.checkItemExist(
                        User,
                        'socialInsurance',
                        data.socialInsurance,
                        id,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'user.common.error.socialInsurance.exist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'socialInsurance',
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                            message: message,
                        },
                    ]);
                }
            }
            if (data.taxCode) {
                if (
                    await this.databaseService.checkItemExist(
                        User,
                        'taxCode',
                        data.taxCode,
                        id,
                    )
                ) {
                    const message = await this.i18n.translate(
                        'user.common.error.taxCode.exist',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'taxCode',
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                            message: message,
                        },
                    ]);
                }
            }
            const promises = [
                this.databaseService.checkItemExist(Role, 'id', data.roleId),
                this.databaseService.checkItemExist(
                    User,
                    'bankAccount',
                    data.bankAccount,
                    id,
                ),
                this.databaseService.checkItemExist(
                    User,
                    'citizenId',
                    data.citizenId,
                    id,
                ),
                (userPositionList || [])
                    .map((u) => u?.code)
                    .includes(data.position),
                this.databaseService.checkItemExist(
                    Province,
                    'id',
                    data.provinceId,
                ),
            ];
            const [role, bankAccount, citizenId, position, province] =
                await Promise.all(promises);

            if (!role) {
                const message = await this.i18n.translate(
                    'role.common.error.role.notFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'roleId',
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message: message,
                    },
                ]);
            }
            if (bankAccount) {
                const message = await this.i18n.translate(
                    'user.common.error.bankAccount.exist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'bankAccount',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message: message,
                    },
                ]);
            }
            if (citizenId) {
                const message = await this.i18n.translate(
                    'user.common.error.citizenId.exist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'citizenId',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message: message,
                    },
                ]);
            }

            if (data.position && !position) {
                const message = await this.i18n.translate(
                    'user.common.error.positionId.notExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'position',
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message: message,
                    },
                ]);
            }

            if (!province) {
                const message = await this.i18n.translate(
                    'user.common.error.provinceId.notExist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'provinceId',
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message: message,
                    },
                ]);
            }

            const savedUser = await this.usersService.updateUser(id, data);
            return new SuccessResponse(savedUser);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':id')
    @Permissions([`${PermissionResources.USER}_${PermissionActions.DELETE}`])
    async delete(@Request() req, @Param('id', ParseIntPipe) id: number) {
        try {
            const user = await this.usersService.getUserById(id);
            if (!user) {
                const message = await this.i18n.translate(
                    'user.common.error.user.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            if (user.status !== UserStatus.WAITING_FOR_APPROVAL) {
                const message = await this.i18n.translate(
                    'user.common.error.waitingForApproval',
                );
                return new ErrorResponse(HttpStatus.ITEM_IS_USING, message, []);
            }

            const contracts = await this.contractService.getAllContractsOfUser(
                id,
            );
            // check has contracts which is active, if > 0 -> return error
            const hasActiveContract = contracts.some(
                (contract) => contract.status === ContractStatus.ACTIVE,
            );
            if (hasActiveContract) {
                const message = await this.i18n.translate(
                    'user.common.error.contract.exist',
                );
                return new ErrorResponse(HttpStatus.ITEM_IS_USING, message, []);
            }
            // delete other 'expired'/'stopped' contracts of this user
            const contractIds = contracts.map((contract) => contract.id);
            await this.contractService.deleteContractByIds(
                contractIds,
                req?.loginUser?.id,
            );
            const [message] = await Promise.all([
                this.i18n.translate('user.delete.success'),
                this.usersService.deleteUser(id, req?.loginUser?.id),
            ]);
            return new SuccessResponse({ id }, message);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id/status')
    @Permissions([`${PermissionResources.USER}_${PermissionActions.UPDATE}`])
    async updateUserStatus(
        @Request() req,
        @Param('id') id: number,
        @Body(new TrimObjectPipe(), new JoiValidationPipe(UserStatusSchema))
        data: UserStatusDto,
    ) {
        try {
            const user = await this.usersService.getUserById(id);

            if (!user) {
                const message = await this.i18n.translate(
                    'user.common.error.user.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            if (!AllowUpdateStatus[user.status].includes(data.status)) {
                const message = await this.i18n.translate(
                    'user.status.error.notAllow',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'status',
                        errorCode: HttpStatus.BAD_REQUEST,
                        message: message,
                    },
                ]);
            }

            if (user.status === UserStatus.WAITING_FOR_APPROVAL) {
                if (data?.status === UserStatus.INACTIVE) {
                    const message = await this.i18n.translate(
                        'user.common.error.waitingForApproval',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'status',
                            errorCode: HttpStatus.BAD_REQUEST,
                            message: message,
                        },
                    ]);
                }
            }
            if (data.status === UserStatus.INACTIVE) {
                const activeContractsCount =
                    await this.contractService.countActiveContractsByUserId(id);
                if (activeContractsCount) {
                    const message = await this.i18n.translate(
                        'user.status.error.contract',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            message,
                            errorCode: HttpStatus.ITEM_IS_USING,
                            key: 'contract',
                        },
                    ]);
                }
            }
            const savedUser = await this.usersService.updateUserStatus(
                id,
                data,
            );
            return new SuccessResponse(savedUser);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
