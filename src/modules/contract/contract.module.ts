import { Module } from '@nestjs/common';
import { DatabaseService } from 'src/common/services/database.service';
import { ContractController } from './contract.controller';
import { ContractService } from './services/contract.service';
import { UpdateContractStatusJob } from './cron-job/updateContractStatus.job';
import { UserService } from '../user/services/user.service';

@Module({
    controllers: [ContractController],
    providers: [
        ContractService,
        DatabaseService,
        UpdateContractStatusJob,
        UserService,
    ],
})
export class ContractModule {}
