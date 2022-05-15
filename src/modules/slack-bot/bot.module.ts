import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotController } from './bot.controller';
import { SlackService } from './services/bot.service';
import { RequestAbsenceService } from '../request-absence/services/requestAbsence.service';
import { UserService } from '../user/services/user.service';

@Module({
    imports: [ConfigService],
    controllers: [BotController],
    providers: [SlackService, RequestAbsenceService, UserService],
})
export class BotModule {}
