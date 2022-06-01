import { Module } from '@nestjs/common';
import { TimekeepingController } from './timekeeping.controller';
import { TimekeepingService } from './services/timekeeping.service';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/services/user.service';
import { DatabaseService } from 'src/common/services/database.service';
import { RequestAbsenceService } from '../request-absence/services/requestAbsence.service';
import { ExportExcelService } from '../timekeeping/services/export-excel.service';
import { HolidayService } from '../setting/services/holiday.service';
import { ContractTypeService } from '../setting/services/contract-type.service';
import { UserTimekeepingHistoryService } from './services/userTimekeepingHistory.service';
import { ContractService } from '../contract/services/contract.service';
import { SettingService } from '../setting/services/setting.service';
@Module({
    imports: [ConfigService],
    controllers: [TimekeepingController],
    providers: [
        TimekeepingService,
        RequestAbsenceService,
        UserService,
        ExportExcelService,
        HolidayService,
        DatabaseService,
        ContractTypeService,
        UserTimekeepingHistoryService,
        SettingService,
        ContractService,
    ],
})
export class TimekeepingModule {}
