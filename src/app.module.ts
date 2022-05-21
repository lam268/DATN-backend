import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './modules/common/common.module';
import { I18nModule } from './common/services/i18n.service';
import { WinstonModule } from './common/services/winston.service';
import { DatabaseModule } from './common/services/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AppController } from './app.controller';
import { RequestAbsenceModule } from './modules/request-absence/requestAbsence.module';
import { TimekeepingModule } from './modules/timekeeping/timekeeping.module';
import { RoleModule } from './modules/role/role.module';
import { ContractModule } from './modules/contract/contract.module';
import { FileModule } from './modules/file/file.module';
import { BotModule } from './modules/slack-bot/bot.module';
import { SetttingModule } from './modules/setting/setting.module';
import envSchema from './common/config/validation-schema';
import { ConfigModule } from '@nestjs/config';
import { GlobalDataService } from './modules/common/services/global-data.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import path from 'path';
@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: path.join(__dirname, '../../exportData'),
            serveRoot: '/export-data/',
        }),
        ConfigModule.forRoot({
            envFilePath: '.env',
            isGlobal: true,
            validationSchema: envSchema,
        }),
        WinstonModule,
        I18nModule,
        CommonModule,
        ScheduleModule.forRoot(),
        DatabaseModule,
        AuthModule,
        UserModule,
        RequestAbsenceModule,
        TimekeepingModule,
        RoleModule,
        ContractModule,
        FileModule,
        BotModule,
        SetttingModule,
    ],
    controllers: [AppController],
    providers: [GlobalDataService],
})
export class AppModule {}
