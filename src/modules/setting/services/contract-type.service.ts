import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_PAGINATION,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
} from 'src/common/constants';
import { ContractType as ContractTypeEntity } from 'src/modules/setting/entity/contract-type.entity';
import { Contract } from 'src/modules/contract/entity/contract.entity';
import { EntityManager, FindOperator, Like, Not } from 'typeorm';
import {
    IContractTypeDto,
    IContractTypeQueryStringDto,
} from '../dto/request/contract-type.dto';
import { ContractTypeList } from '../dto/response/api-response.dto';

const contractTypeListAtttributes = [
    'id',
    'name',
    'expiredIn',
    'paidLeaveDays',
    'description',
];

const contractTypesAttributes: (keyof ContractTypeEntity)[] = [
    'id',
    'name',
    'description',
    'expiredIn',
    'paidLeaveDays',
];
@Injectable()
export class ContractTypeService {
    constructor(
        @InjectEntityManager()
        private readonly dbManager: EntityManager,
    ) {}

    async getContractTypeList(
        query: IContractTypeQueryStringDto,
    ): Promise<ContractTypeList> {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                orderBy = DEFAULT_ORDER_BY,
                orderDirection = DEFAULT_ORDER_DIRECTION,
            } = query;
            //Pagination
            const where: {
                name?: FindOperator<string>;
                description?: FindOperator<string>;
            }[] = [];
            if (keyword) {
                where.push({ name: Like(`%${keyword}%`) });
                where.push({ description: Like(`%${keyword}%`) });
            }
            const [items, totalItems] = await this.dbManager
                .getRepository(ContractTypeEntity)
                .findAndCount({
                    where: where,
                    take: limit,
                    skip: (+page - 1) * limit,
                    order: {
                        [orderBy]: orderDirection.toUpperCase(),
                    },
                    select: contractTypeListAtttributes as (keyof ContractTypeEntity)[],
                });

            return { items, totalItems };
        } catch (error) {
            throw error;
        }
    }

    async getContractTypeDetail(id: number) {
        try {
            const contractType = await this.dbManager.findOne(
                ContractTypeEntity,
                {
                    select: contractTypesAttributes,
                    where: { id: id },
                },
            );
            return contractType;
        } catch (error) {
            throw error;
        }
    }

    async createContractType(contractType: IContractTypeDto) {
        try {
            const insertedContractType = await this.dbManager
                .getRepository(ContractTypeEntity)
                .insert(contractType);
            const contractTypeId = insertedContractType?.identifiers[0]?.id;
            if (contractTypeId) {
                const contractTypeDetail = await this.getContractTypeDetail(
                    contractTypeId,
                );
                return contractTypeDetail;
            }
            throw new InternalServerErrorException();
        } catch (error) {
            throw error;
        }
    }

    async updateContractType(id: number, contractType: IContractTypeDto) {
        try {
            await this.dbManager
                .getRepository(ContractTypeEntity)
                .update({ id }, contractType);
            const updatedContractType = await this.getContractTypeDetail(id);
            return updatedContractType;
        } catch (error) {
            throw error;
        }
    }

    async deleteContractType(id: number, deletedBy: number) {
        try {
            await this.dbManager.update(
                ContractTypeEntity,
                { id },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
            );
        } catch (error) {
            throw error;
        }
    }

    async checkIfContractTypeIsUsedByAnyContract(contractTypeId: number) {
        try {
            const item = await this.dbManager.getRepository(Contract).count({
                where: {
                    contractTypeId,
                },
            });
            return item;
        } catch (error) {
            throw error;
        }
    }

    async checkExistedContractTypeName(name: string, id?: number) {
        try {
            const where = {
                name,
            };
            if (id) {
                Object.assign(where, {
                    id: Not(id),
                });
            }
            return this.dbManager.count(ContractTypeEntity, { where });
        } catch (error) {
            throw error;
        }
    }
}
