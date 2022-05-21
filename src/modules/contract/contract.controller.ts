import {
    Body,
    Controller,
    InternalServerErrorException,
    Post,
    UseGuards,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    Get,
    Query,
    Request,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { ContractService } from './services/contract.service';
import {
    CreateContractDto,
    CreateContractSchema,
} from './dto/requests/create-contract.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { ContractList } from './dto/response/api-response.dto';
import { DatabaseService } from '../../common/services/database.service';
import { JoiValidationPipe } from '../../common/pipes/joi.validation.pipe';
import {
    SuccessResponse,
    ErrorResponse,
} from '../../common/helpers/api.response';
import {
    UpdateContractDto,
    UpdateContractSchema,
    UpdateContractStatusDto,
    UpdateContractStatusSchema,
} from './dto/requests/update-contract.dto';
import {
    ContractQueryStringDto,
    ContractListQueryStringSchema,
} from './dto/requests/list-contract.dto';
import { ContractGroupBy, ContractStatus } from './contract.constant';
import {
    AuthorizationGuard,
    Permissions,
} from 'src/common/guards/authorization.guard';
import {
    PermissionResources,
    PermissionActions,
} from 'src/modules/role/role.constants';
import { HttpStatus } from 'src/common/constants';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import moment from 'moment';
import { TrimObjectPipe } from 'src/common/pipes/trim.object.pipe';
import { UserService } from '../user/services/user.service';
import { UserStatus } from '../user/user.constant';

@Controller('contract')
@UseGuards(JwtGuard, AuthorizationGuard)
export class ContractController {
    constructor(
        private readonly contractsSevice: ContractService,
        private readonly i18n: I18nRequestScopeService,
        private readonly databaseService: DatabaseService,
        private readonly userSerive: UserService,
    ) {}

    @Get()
    @Permissions([`${PermissionResources.CONTRACT}_${PermissionActions.READ}`])
    async getContracts(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(ContractListQueryStringSchema),
        )
        query: ContractQueryStringDto,
    ) {
        try {
            let contractList: ContractList;
            if (query?.groupBy === ContractGroupBy.USER) {
                contractList =
                    await this.contractsSevice.getContractsGroupByUser(query);
            } else {
                contractList = await this.contractsSevice.getContracts(query);
            }
            return new SuccessResponse(contractList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':id')
    @Permissions([`${PermissionResources.CONTRACT}_${PermissionActions.READ}`])
    async getContract(@Param('id', ParseIntPipe) id: number) {
        try {
            const contract = await this.contractsSevice.getContractById(id);
            if (!contract) {
                const message = await this.i18n.translate(
                    'contract.common.error.contract.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(contract);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post()
    @Permissions([
        `${PermissionResources.CONTRACT}_${PermissionActions.CREATE}`,
    ])
    async create(
        @Request() req,
        @Body(new TrimObjectPipe(), new JoiValidationPipe(CreateContractSchema))
        body: CreateContractDto,
    ) {
        try {
            const [user, contractType] = await Promise.all([
                this.userSerive.getUserById(body.userId),
                this.contractsSevice.getContractTypeDetail(body.contractTypeId),
            ]);
            if (!user) {
                const message = await this.i18n.t(
                    'contract.common.error.user.notFound',
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
                    'contract.common.error.notActiveUser',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'userId',
                        message,
                        errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                    },
                ]);
            }

            if (!contractType) {
                const message = await this.i18n.t(
                    'contract.common.error.contractType.notFound',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'contractTypeId',
                        message,
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                    },
                ]);
            }

            const contractsCount =
                await this.contractsSevice.countActiveContractsByUserId(
                    body.userId,
                );
            if (contractsCount > 0) {
                const message = await this.i18n.translate(
                    'contract.common.error.active.conflict',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'userId',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }

            if (contractType.expiredIn) {
                body.endDate = new Date(
                    moment(body.startDate)
                        .add(contractType.expiredIn, 'month')
                        .subtract(1, 'day')
                        .endOfDay()
                        .fmFullTimeString(),
                );
            } else {
                body.endDate = null;
            }

            const newContract = await this.contractsSevice.createContract(body);
            await this.databaseService.recordUserLogging({
                userId: req.loginUser?.id,
                route: req.route,
                oldValue: {},
                newValue: { ...newContract },
            });
            return new SuccessResponse(newContract);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    @Permissions([
        `${PermissionResources.CONTRACT}_${PermissionActions.UPDATE}`,
    ])
    async update(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body(new TrimObjectPipe(), new JoiValidationPipe(UpdateContractSchema))
        body: UpdateContractDto,
    ) {
        try {
            const contract = await this.contractsSevice.getContractById(id);
            if (!contract) {
                const message = await this.i18n.translate(
                    'contract.common.error.contract.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            if (
                contract.status !== ContractStatus.ACTIVE &&
                contract.status !== ContractStatus.ABOUT_TO_ACTIVE
            ) {
                const message = await this.i18n.translate(
                    'contract.common.error.contract.cantUpdate',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, []);
            }

            if (body?.contractTypeId) {
                const contractType =
                    await this.contractsSevice.getContractTypeDetail(
                        body.contractTypeId,
                    );
                if (!contractType) {
                    const message = await this.i18n.t(
                        'contract.common.error.contractType.notFound',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'contractTypeId',
                            message,
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                        },
                    ]);
                }
                if (contractType.expiredIn) {
                    body.endDate = moment(body.startDate)
                        .add(contractType.expiredIn, 'month')
                        .subtract(1, 'day')
                        .endOfDay()
                        .toDate();
                } else {
                    body.endDate = null;
                }
            }

            // set updatedBy
            body.updatedBy = req.loginUser.id;
            const updatedContract = await this.contractsSevice.updateContract(
                id,
                body,
            );
            await this.databaseService.recordUserLogging({
                userId: req.loginUser?.id,
                route: req.route,
                oldValue: { ...contract },
                newValue: { ...updatedContract },
            });
            return new SuccessResponse(updatedContract);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':id')
    @Permissions([
        `${PermissionResources.CONTRACT}_${PermissionActions.DELETE}`,
    ])
    async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
        try {
            const contract = await this.contractsSevice.getContractById(id);
            if (!contract) {
                const message = await this.i18n.translate(
                    'contract.common.error.contract.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            if (contract.status !== ContractStatus.ACTIVE) {
                const message = await this.i18n.translate(
                    'contract.common.error.contract.cantDelete',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, []);
            }

            const [message] = await Promise.all([
                this.i18n.translate('contract.delete.success'),
                this.contractsSevice.deleteContract(id, req?.loginUser?.id),
            ]);
            await this.databaseService.recordUserLogging({
                userId: req.loginUser?.id,
                route: req.route,
                oldValue: { ...contract },
                newValue: {},
            });
            return new SuccessResponse({ id }, message);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id/status')
    @Permissions([
        `${PermissionResources.CONTRACT}_${PermissionActions.UPDATE}`,
    ])
    async updateStatus(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body(
            new TrimObjectPipe(),
            new JoiValidationPipe(UpdateContractStatusSchema),
        )
        body: UpdateContractStatusDto,
    ) {
        try {
            const contract = await this.contractsSevice.getContractById(id);
            if (!contract) {
                const message = await this.i18n.translate(
                    'contract.common.error.contract.notFound',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }

            if (
                contract.status !== ContractStatus.ACTIVE &&
                contract.status !== ContractStatus.ABOUT_TO_ACTIVE
            ) {
                const message = await this.i18n.translate(
                    'contract.common.error.contract.cantUpdate',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                        message,
                        key: 'id',
                    },
                ]);
            }
            if (body.status === ContractStatus.STOPPED) {
                if (
                    moment(body.stopDate).isSameOrBefore(
                        moment(contract.startDate),
                    )
                ) {
                    const message = await this.i18n.translate(
                        'contract.common.error.endDate.lessThanStartDate',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            message,
                            key: 'stopDate',
                        },
                    ]);
                }
                if (
                    contract.stopDate &&
                    moment(body.stopDate).isAfter(moment(contract.stopDate))
                ) {
                    const message = await this.i18n.translate(
                        'contract.common.error.endDate.moreThanEndDate',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            message,
                            key: 'stopDate',
                        },
                    ]);
                }
                body.stopDate = moment(body.stopDate).endOfDay().toDate();
            }
            // set updatedBy
            body.updatedBy = req.loginUser.id;
            const updatedContract =
                await this.contractsSevice.updateContractStatus(id, body);
            await this.databaseService.recordUserLogging({
                userId: req.loginUser?.id,
                route: req.route,
                oldValue: { ...contract },
                newValue: { ...updatedContract },
            });
            return new SuccessResponse(updatedContract);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
