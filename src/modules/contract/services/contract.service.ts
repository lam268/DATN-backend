import { InternalServerErrorException } from '@nestjs/common';
import {
    DEFAULT_FIRST_PAGE,
    DEFAULT_LIMIT_FOR_GROUP,
    DEFAULT_LIMIT_FOR_PAGINATION,
    DEFAULT_ORDER_BY,
    DEFAULT_ORDER_DIRECTION,
    TIMEZONE_NAME_DEFAULT,
    TYPE_ORM_ORDER_DIRECTION,
} from '../../../common/constants';
import { InjectEntityManager } from '@nestjs/typeorm';
import { CreateContractDto } from '../dto/requests/create-contract.dto';
import { Between, Brackets, EntityManager, In, Not } from 'typeorm';

import { Contract } from 'src/modules/contract/entity/contract.entity';
import { ContractResponseDto } from '../dto/response/contract-response.dto';
import { ContractList } from '../dto/response/api-response.dto';
import {
    UpdateContractDto,
    UpdateContractStatusDto,
} from '../dto/requests/update-contract.dto';
import { ContractQueryStringDto } from '../dto/requests/list-contract.dto';
import { ContractOrderBy, ContractStatus } from '../contract.constant';
import { ContractType } from 'src/modules/setting/entity/contract-type.entity';
import { User } from 'src/modules/user/entity/user.entity';
import moment from 'moment';

const contractAttributes: (keyof Contract)[] = [
    'id',
    'user',
    'startDate',
    'endDate',
    'url',
    'contractTypeId',
    'status',
    'contractType',
    'createdAt',
];

const contractTypesAttributes: (keyof ContractType)[] = [
    'id',
    'name',
    'description',
    'expiredIn',
    'paidLeaveDays',
];

export class ContractService {
    constructor(
        @InjectEntityManager()
        private readonly dbManager: EntityManager,
    ) {}

    generateQueryBuilder(
        queryBuilder,
        { userIds, startDate, endDate, stopDate, statuses, contractTypeIds },
    ) {
        if (userIds && userIds.length > 0) {
            queryBuilder.andWhere({
                userId: In(userIds),
            });
        }

        if (contractTypeIds && contractTypeIds.length > 0) {
            queryBuilder.andWhere({
                contractTypeId: In(contractTypeIds),
            });
        }

        if (startDate.length === 2) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.where(
                        'startDate >= :startOfStartDate AND startDate <= :endOfStartDate',
                        {
                            startOfStartDate: startDate[0],
                            endOfStartDate: startDate[1],
                        },
                    );
                }),
            );
        }

        if (endDate.length === 2) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.where(
                        'endDate >= :startOfEndDate AND endDate <= :endOfEndDate',
                        {
                            startOfEndDate: endDate[0],
                            endOfEndDate: endDate[1],
                        },
                    );
                }),
            );
        }

        if (stopDate.length === 2) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.where(
                        'stopDate >= :startOfStopDate AND stopDate <= :endOfStopDate',
                        {
                            startOfStopDate: stopDate[0],
                            endOfStopDate: stopDate[1],
                        },
                    );
                }),
            );
        }

        if (statuses && statuses.length > 0) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    if (statuses?.includes(ContractStatus.ABOUT_TO_EXPIRE)) {
                        qb.andWhere(
                            new Brackets((qb) => {
                                qb.where({
                                    endDate: Between(
                                        moment().toDate(),
                                        moment().add(1, 'month').toDate(),
                                    ),
                                });
                                qb.andWhere({
                                    status: ContractStatus.ACTIVE,
                                });
                            }),
                        );
                        statuses = statuses.filter(
                            (status) =>
                                status !== ContractStatus.ABOUT_TO_EXPIRE,
                        );
                    }

                    if (statuses.length) {
                        qb.orWhere({
                            status: In(statuses),
                        });
                    }
                }),
            );
        }
    }

    async getContractsGroupByUser(
        query: ContractQueryStringDto,
    ): Promise<ContractList> {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                userIds = [],
                startDate = [],
                endDate = [],
                stopDate = [],
                statuses = [],
                contractTypeIds = [],
            } = query;

            // Pagination
            const take = +limit || DEFAULT_LIMIT_FOR_PAGINATION;
            const skip = +(page - 1) * take || 0;
            const [rawUserIds, totalItems] = await Promise.all([
                this.dbManager
                    .getRepository(Contract)
                    .createQueryBuilder('contracts')
                    .select('DISTINCT userId')
                    .where((queryBuilder) =>
                        this.generateQueryBuilder(queryBuilder, {
                            userIds,
                            startDate,
                            endDate,
                            stopDate,
                            statuses,
                            contractTypeIds,
                        }),
                    )
                    .skip(skip)
                    .take(take)
                    .getRawMany(),
                this.dbManager
                    .getRepository(Contract)
                    .createQueryBuilder('contracts')
                    .select('COUNT(DISTINCT userId) as count')
                    .where((queryBuilder) =>
                        this.generateQueryBuilder(queryBuilder, {
                            userIds,
                            startDate,
                            endDate,
                            stopDate,
                            statuses,
                            contractTypeIds,
                        }),
                    )
                    .getRawOne(),
            ]);
            const selectedUserIds = rawUserIds.map((user) => user.userId);
            if (!selectedUserIds.length) {
                return {
                    items: [],
                    totalItems: totalItems.count,
                };
            }

            const _queryBuilder = await this.dbManager
                .createQueryBuilder(Contract, 'contract')
                .leftJoinAndMapOne(
                    'contract.user',
                    User,
                    'user',
                    'contract.userId = user.id',
                )
                .leftJoinAndMapOne(
                    'contract.contractType',
                    ContractType,
                    'contractType',
                    'contract.contractTypeId = contractType.id',
                )
                .where((queryBuilder) =>
                    this.generateQueryBuilder(queryBuilder, {
                        userIds: selectedUserIds,
                        startDate,
                        endDate,
                        stopDate,
                        statuses,
                        contractTypeIds,
                    }),
                )
                .orderBy(
                    ContractOrderBy.USER_ID,
                    DEFAULT_ORDER_DIRECTION.toUpperCase() as TYPE_ORM_ORDER_DIRECTION,
                )
                .take(DEFAULT_LIMIT_FOR_GROUP);

            const items = await _queryBuilder.getMany();
            return {
                items,
                totalItems: totalItems.count,
            };
        } catch (error) {
            throw error;
        }
    }

    async getContracts(query: ContractQueryStringDto): Promise<ContractList> {
        try {
            const {
                page = DEFAULT_FIRST_PAGE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                orderBy = DEFAULT_ORDER_BY,
                orderDirection = DEFAULT_ORDER_DIRECTION,
                userIds = [],
                startDate = [],
                endDate = [],
                stopDate = [],
                statuses = [],
                contractTypeIds = [],
            } = query;

            // Pagination
            const take = +limit || DEFAULT_LIMIT_FOR_PAGINATION;
            const skip = +(page - 1) * take || 0;

            const _queryBuilder = await this.dbManager
                .createQueryBuilder(Contract, 'contract')
                .leftJoinAndMapOne(
                    'contract.user',
                    User,
                    'user',
                    'contract.userId = user.id',
                )
                .leftJoinAndMapOne(
                    'contract.contractType',
                    ContractType,
                    'contractType',
                    'contract.contractTypeId = contractType.id',
                )
                .where((queryBuilder) =>
                    this.generateQueryBuilder(queryBuilder, {
                        userIds,
                        startDate,
                        endDate,
                        stopDate,
                        statuses,
                        contractTypeIds,
                    }),
                )
                .orderBy(
                    orderBy,
                    orderDirection.toUpperCase() as TYPE_ORM_ORDER_DIRECTION,
                )
                .take(take)
                .skip(skip);

            const [items, totalItems] = await _queryBuilder.getManyAndCount();
            return {
                items,
                totalItems,
            };
        } catch (error) {
            throw error;
        }
    }

    async getAllContractsOfUser(
        userId: number,
    ): Promise<ContractResponseDto[]> {
        try {
            const contracts = await this.dbManager.find(Contract, {
                where: { userId },
            });
            return contracts;
        } catch (error) {
            throw error;
        }
    }

    async getContractById(id: number): Promise<ContractResponseDto> {
        try {
            const contract = await this.dbManager.findOne(Contract, {
                select: contractAttributes,
                where: { id },
                relations: ['user', 'contractType'],
            });
            return contract;
        } catch (error) {
            throw error;
        }
    }

    async getContractTypeDetail(id: number) {
        try {
            const contractType = await this.dbManager.findOne(ContractType, {
                select: contractTypesAttributes,
                where: { id: id },
            });
            return contractType;
        } catch (error) {
            throw error;
        }
    }

    async createContract(
        contract: CreateContractDto,
    ): Promise<ContractResponseDto> {
        try {
            if (
                moment(contract.startDate).isAfter(
                    moment().tz(TIMEZONE_NAME_DEFAULT).endOfDay().utc(),
                )
            ) {
                contract.status = ContractStatus.ABOUT_TO_ACTIVE;
            } else if (!contract.endDate) {
                contract.status = ContractStatus.ACTIVE;
            } else {
                const contractTimeRemaining = moment(contract.endDate).diff(
                    moment(),
                    'day',
                );
                if (contractTimeRemaining <= 0) {
                    contract.status = ContractStatus.EXPIRED;
                } else {
                    contract.status = ContractStatus.ACTIVE;
                }
            }
            const insertedContract = await this.dbManager
                .getRepository(Contract)
                .insert({
                    ...contract,
                });
            const contractId = insertedContract?.identifiers[0]?.id;
            if (contractId) {
                const contractDetail = await this.getContractById(contractId);
                return contractDetail;
            }
            throw new InternalServerErrorException();
        } catch (error) {
            throw error;
        }
    }

    async updateContract(
        id: number,
        contract: UpdateContractDto,
    ): Promise<ContractResponseDto> {
        try {
            if (
                moment(contract.startDate).isAfter(
                    moment().tz(TIMEZONE_NAME_DEFAULT).endOfDay().utc(),
                )
            ) {
                contract.status = ContractStatus.ABOUT_TO_ACTIVE;
            } else if (!contract.endDate) {
                contract.status = ContractStatus.ACTIVE;
            } else {
                const contractTimeRemaining = moment(contract.endDate).diff(
                    moment(),
                    'day',
                );
                if (contractTimeRemaining <= 0) {
                    contract.status = ContractStatus.EXPIRED;
                } else {
                    contract.status = ContractStatus.ACTIVE;
                }
            }
            await this.dbManager
                .getRepository(Contract)
                .update({ id }, contract);
            const updatedContract = await this.getContractById(id);
            return updatedContract;
        } catch (error) {
            throw error;
        }
    }

    async updateContractStatus(
        id: number,
        body: UpdateContractStatusDto,
    ): Promise<ContractResponseDto> {
        try {
            await this.dbManager.getRepository(Contract).update({ id }, body);
            const updatedContract = await this.getContractById(id);
            return updatedContract;
        } catch (error) {
            throw error;
        }
    }

    async deleteContract(id: number, deletedBy: number) {
        try {
            await this.dbManager.update(
                Contract,
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

    async deleteContractByIds(ids: number[], deletedBy: number) {
        try {
            await this.dbManager.update(
                Contract,
                { id: In([...ids]) },
                {
                    deletedAt: new Date(),
                    deletedBy,
                },
            );
        } catch (error) {
            throw error;
        }
    }

    async countActiveContractsByUserId(
        userId: number,
        contractId?: number,
    ): Promise<number> {
        try {
            const where = {
                userId,
                status: ContractStatus.ACTIVE,
            };
            if (contractId) {
                Object.assign(where, {
                    id: Not(contractId),
                });
            }
            const contractsCount = await this.dbManager.count(Contract, {
                where,
            });

            return contractsCount;
        } catch (error) {
            throw error;
        }
    }

    async getActiveContractByUserId(userId: number) {
        try {
            const contract = await this.dbManager.findOne(Contract, {
                where: {
                    userId,
                    status: ContractStatus.ACTIVE,
                },
                relations: ['contractType'],
            });
            return contract;
        } catch (error) {
            throw error;
        }
    }
}
