import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { Contract } from '../entity/contract.entity';
import { TIMEZONE_NAME_DEFAULT } from 'src/common/constants';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { MODULE_NAME, ContractStatus } from '../contract.constant';
import { EntityManager, LessThan, LessThanOrEqual } from 'typeorm';
import moment from 'moment';
import * as dotenv from 'dotenv';
dotenv.config();

const CRON_JOB_CONTRACT_UPDATE_STATUS =
    process.env.CRON_JOB_CONTRACT_UPDATE_STATUS || '15 18 * * *';

//Change contract status from active to inactive if this contract outdate
@Injectable()
export class UpdateContractStatusJob {
    constructor(
        private readonly configService: ConfigService,
        private readonly dbManager: EntityManager,
    ) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `${MODULE_NAME}-update-status-job`,
        this.configService,
    );

    async updateExpiredContract() {
        try {
            const today = moment().startOfDay().toDate();
            await this.dbManager.getRepository(Contract).update(
                {
                    status: ContractStatus.ACTIVE,
                    endDate: LessThan(today),
                },
                { status: ContractStatus.EXPIRED },
            );
        } catch (error) {
            this.logger.error('Error in expireContract func: ', error);
        }
    }

    async updateAboutToActiveContract() {
        try {
            const today = moment().startOfDay().toDate();
            await this.dbManager.getRepository(Contract).update(
                {
                    status: ContractStatus.ABOUT_TO_ACTIVE,
                    startDate: LessThanOrEqual(today),
                },
                { status: ContractStatus.ACTIVE },
            );
        } catch (error) {
            this.logger.error(
                'Error in updateAboutToActiveContract func: ',
                error,
            );
        }
    }

    @Cron(CRON_JOB_CONTRACT_UPDATE_STATUS, {
        timeZone: TIMEZONE_NAME_DEFAULT,
    })
    async updateContractStatus() {
        try {
            this.logger.info('start updateContractStatus at', new Date());
            await Promise.all([
                this.updateAboutToActiveContract(),
                this.updateExpiredContract(),
            ]);
        } catch (error) {
            this.logger.error('Error in updateContractStatus: ', error);
        }
    }
}
