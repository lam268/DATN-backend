import {
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    Param,
    Patch,
    Post,
    UseGuards,
    Request,
    Delete,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import {
    ErrorResponse,
    SuccessResponse,
} from '../../common/helpers/api.response';
import { JoiValidationPipe } from '../../common/pipes/joi.validation.pipe';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { DatabaseService } from '../../common/services/database.service';
import {
    AuthorizationGuard,
    Permissions,
} from 'src/common/guards/authorization.guard';
import { ContractTypeService } from './services/contract-type.service';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import {
    ContractTypeListQueryStringSchema,
    IContractTypeDto,
    IContractTypeQueryStringDto,
    saveContractTypeSchema,
    UpdateContractTypeDto,
    UpdateContractTypeSchema,
} from './dto/request/contract-type.dto';
import { PermissionActions, PermissionResources } from '../role/role.constants';
import { HttpStatus } from 'src/common/constants';
import { TrimObjectPipe } from 'src/common/pipes/trim.object.pipe';
@Controller('/setting/contract-type')
@UseGuards(JwtGuard, AuthorizationGuard)
export class ContractTypeController {
    constructor(
        private readonly contractTypeService: ContractTypeService,
        private readonly databaseService: DatabaseService,
        private readonly i18n: I18nRequestScopeService,
    ) {}

    @Get('/')
    @Permissions([
        `${PermissionResources.SETTING}_${PermissionActions.READ}`,
        `${PermissionResources.CONTRACT}_${PermissionActions.READ}`,
    ])
    async getContractTypeList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(ContractTypeListQueryStringSchema),
        )
        query: IContractTypeQueryStringDto,
    ) {
        try {
            const listContractType =
                await this.contractTypeService.getContractTypeList(query);
            return new SuccessResponse(listContractType);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/:id')
    @Permissions([`${PermissionResources.SETTING}_${PermissionActions.READ}`])
    async getContractType(@Param('id', ParseIntPipe) id: number) {
        try {
            const contractType =
                await this.contractTypeService.getContractTypeDetail(id);
            if (!contractType) {
                const message = await this.i18n.translate(
                    'contract-type.errorMessages.itemNotExisted',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(contractType);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/')
    @Permissions([`${PermissionResources.SETTING}_${PermissionActions.UPDATE}`])
    async saveContractType(
        @Request() req,
        @Body(
            new TrimObjectPipe(),
            new JoiValidationPipe(saveContractTypeSchema),
        )
        data: IContractTypeDto,
    ) {
        try {
            const checkExistedName =
                await this.contractTypeService.checkExistedContractTypeName(
                    data.name,
                );
            if (checkExistedName) {
                const message = await this.i18n.t(
                    'contract-type.errorMessages.nameExisted',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }
            const savedContractType =
                await this.contractTypeService.createContractType({
                    ...data,
                    createdBy: req.loginUser.id,
                });
            return new SuccessResponse(savedContractType);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/:id')
    @Permissions([`${PermissionResources.SETTING}_${PermissionActions.UPDATE}`])
    async updateContractType(
        @Request() req,
        @Param('id') id: number,
        @Body(
            new TrimObjectPipe(),
            new JoiValidationPipe(UpdateContractTypeSchema),
        )
        data: UpdateContractTypeDto,
    ) {
        try {
            const contractType =
                await this.contractTypeService.getContractTypeDetail(id);
            if (!contractType) {
                const message = await this.i18n.translate(
                    'contract-type.errorMessages.itemNotExisted',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const checkExistedName =
                await this.contractTypeService.checkExistedContractTypeName(
                    data.name,
                    id,
                );
            if (checkExistedName) {
                const message = await this.i18n.t(
                    'contract-type.errorMessages.nameExisted',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }
            const checkContractTypeBeingUsed =
                await this.contractTypeService.checkIfContractTypeIsUsedByAnyContract(
                    id,
                );
            if (checkContractTypeBeingUsed) {
                const message = await this.i18n.translate(
                    'contract-type.errorMessages.itemBeingUsed',
                );
                return new ErrorResponse(HttpStatus.ITEM_IS_USING, message, []);
            }
            const updatedContractType =
                await this.contractTypeService.updateContractType(id, {
                    ...data,
                    updatedBy: req.loginUser.id,
                });
            await this.databaseService.recordUserLogging({
                userId: req.loginUser?.id,
                route: req.route,
                oldValue: { ...contractType },
                newValue: { ...updatedContractType },
            });
            return new SuccessResponse(updatedContractType);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/:id')
    @Permissions([`${PermissionResources.SETTING}_${PermissionActions.UPDATE}`])
    async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
        try {
            const contractType =
                await this.contractTypeService.getContractTypeDetail(id);
            if (!contractType) {
                const message = await this.i18n.translate(
                    'contract-type.errorMessages.itemNotExisted',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const checkContractTypeBeingUsed =
                await this.contractTypeService.checkIfContractTypeIsUsedByAnyContract(
                    id,
                );
            if (checkContractTypeBeingUsed) {
                const message = await this.i18n.translate(
                    'contract-type.errorMessages.itemBeingUsed',
                );
                return new ErrorResponse(HttpStatus.ITEM_IS_USING, message, []);
            }
            await this.contractTypeService.deleteContractType(
                id,
                req.loginUser.id,
            );
            const message = await this.i18n.translate(
                'contract-type.successMessages.delete',
            );
            await this.databaseService.recordUserLogging({
                userId: req.loginUser?.id,
                route: req.route,
                oldValue: { ...contractType },
                newValue: {},
            });
            return new SuccessResponse({ id }, message);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
