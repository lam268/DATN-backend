import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { ContractService } from '../contract/services/contract.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { RoleModule } from '../role/role.module';
import { DatabaseService } from 'src/common/services/database.service';
import { ImportUserService } from './services/user.import.service';

@Module({
    imports: [AuthModule, RoleModule],
    controllers: [UserController],
    providers: [
        UserService,
        ContractService,
        DatabaseService,
        ImportUserService,
    ],
    exports: [UserService],
})
export class UserModule {}
