import { Module } from '@nestjs/common';
import { DatabaseService } from 'src/common/services/database.service';
import { ContractTypeController } from './contract-type.controller';
import { ContractTypeService } from './services/contract-type.service';
import { HolidayController } from './holiday.controller';
import { HolidayService } from './services/holiday.service';
import { GlobalDataService } from '../common/services/global-data.service';
import { SettingService } from './services/setting.service';
import { SettingController } from './setting.controller';
import { UserService } from '../user/services/user.service';
import { AssetService } from '../asset/services/asset.service';
import { RecruitmentService } from '../recruitment/service/candidate.service';

@Module({
    controllers: [SettingController, ContractTypeController, HolidayController],
    providers: [
        SettingService,
        DatabaseService,
        ContractTypeService,
        GlobalDataService,
        HolidayService,
        UserService,
        AssetService,
        RecruitmentService,
    ],
})
export class SetttingModule {}
