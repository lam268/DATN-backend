import { Module } from '@nestjs/common';
import { RequestAbsenceController } from './requestAbsence.controller';
import { RequestAbsenceService } from './services/requestAbsence.service';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/services/user.service';
import { SlackService } from '../slack-bot/services/bot.service';
import { DatabaseService } from 'src/common/services/database.service';

@Module({
    imports: [ConfigService],
    controllers: [RequestAbsenceController],
    providers: [
        RequestAbsenceService,
        UserService,
        DatabaseService,
        SlackService,
    ],
})
export class RequestAbsenceModule {}
