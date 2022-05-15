import { SuccessResponse } from 'src/common/helpers/api.response';
import {
    Controller,
    Get,
    InternalServerErrorException,
    UseGuards,
    Query,
} from '@nestjs/common';
import { JoiValidationPipe } from '../../common/pipes/joi.validation.pipe';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { queryDropdownSchema } from './dto/request/dropdown.dto';

import { CommonDropdownService } from './services/common-dropdown.service';
import {
    ListBankDropdown,
    ListProvinceDropdown,
    ListRoleDropdown,
    ListUserDropdown,
} from './dto/responses/user-dropdown-response.dto';
import { QueryDropdown } from './dto/request/dropdown.dto';
import {
    AuthorizationGuard,
    Permissions,
} from 'src/common/guards/authorization.guard';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';

import {
    PermissionResources,
    PermissionActions,
} from 'src/modules/role/role.constants';

@Controller('common')
export class CommonController {
    constructor(
        private readonly commonDropdownService: CommonDropdownService,
    ) {}

    @Get('/province')
    @UseGuards(JwtGuard)
    async getProvinces(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryDropdownSchema),
        )
        query: QueryDropdown,
    ) {
        try {
            const listProvince: ListProvinceDropdown =
                await this.commonDropdownService.getListProvince(query);

            return new SuccessResponse(listProvince);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/user')
    @UseGuards(JwtGuard, AuthorizationGuard)
    @Permissions([
        `${PermissionResources.USER}_${PermissionActions.READ}`,
        `${PermissionResources.CONTRACT}_${PermissionActions.READ}`,
        `${PermissionResources.BILLING}_${PermissionActions.READ}`,
    ])
    async getUsers(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryDropdownSchema),
        )
        query: QueryDropdown,
    ) {
        try {
            const listUserDropdown: ListUserDropdown =
                await this.commonDropdownService.getListUser(query);
            return new SuccessResponse(listUserDropdown);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/role')
    @UseGuards(JwtGuard, AuthorizationGuard)
    @Permissions([`${PermissionResources.USER}_${PermissionActions.READ}`])
    async getRoles(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryDropdownSchema),
        )
        query: QueryDropdown,
    ) {
        try {
            const listRoleDropdown: ListRoleDropdown =
                await this.commonDropdownService.getListRole(query);
            return new SuccessResponse(listRoleDropdown);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/bank')
    @UseGuards(JwtGuard)
    async getBanks(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(queryDropdownSchema),
        )
        query: QueryDropdown,
    ) {
        try {
            const data: ListBankDropdown =
                await this.commonDropdownService.getListBank(query);
            return new SuccessResponse(data);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
