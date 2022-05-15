/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Controller,
    InternalServerErrorException,
    Post,
    Body,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { SlackService } from './services/bot.service';
import { PAYLOAD_TYPE } from './bot.constants';
import { IEventBody, IInteractive, IInteractiveBody } from './bot.interface';
import { parseToSnakeCase } from 'src/common/helpers/common.function';
import { HttpStatus } from 'src/common/constants';
import { TrimObjectPipe } from 'src/common/pipes/trim.object.pipe';
@Controller('slack')
export class BotController {
    constructor(private readonly slackService: SlackService) {}

    @Post('/events')
    async connectSlack(
        @Body(new TrimObjectPipe()) payload: IEventBody,
        @Res() res: Response,
    ) {
        try {
            if (payload.challenge) {
                const { challenge } = payload;
                res.status(HttpStatus.OK).send({
                    challenge: parseToSnakeCase(challenge),
                });
            } else {
                const { event } = payload;
                if (event?.type === PAYLOAD_TYPE.APP_MENTION) {
                    await this.slackService.responseMessage(event);
                    res.status(HttpStatus.OK).send();
                }
            }
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/interactive-endpoint')
    async shortcut(
        @Body(new TrimObjectPipe()) data: IInteractiveBody,
        @Res() res: Response,
    ) {
        try {
            const payload: IInteractive = JSON.parse(data.payload);
            switch (payload?.type) {
                case PAYLOAD_TYPE.SHORTCUT: {
                    switch (payload?.callbackId) {
                        case PAYLOAD_TYPE.ABSENT_REQUEST:
                            await this.slackService.absenceRequest(payload);
                            break;
                        case PAYLOAD_TYPE.CREATE_POLL:
                            await this.slackService.createPoll(payload);
                            break;
                        default:
                            break;
                    }
                }
                case PAYLOAD_TYPE.VIEW_SUBMISSION: {
                    switch (payload?.view?.callbackId) {
                        case PAYLOAD_TYPE.AR_INPUT:
                            const result =
                                await this.slackService.resolveAbsenceRequest(
                                    payload,
                                );
                            if (result.status === HttpStatus.OK) {
                                res.status(HttpStatus.OK).send();
                            } else {
                                res.send({
                                    response_action: 'errors',
                                    errors: {
                                        reason: result.message,
                                    },
                                });
                            }
                            break;
                        case PAYLOAD_TYPE.POLL_INPUT:
                            const response =
                                await this.slackService.resolvePollCreate(
                                    payload,
                                );
                            if (response.status === HttpStatus.OK) {
                                res.status(HttpStatus.OK).send();
                            }
                            res.status(HttpStatus.OK).send();
                            break;
                        default:
                            break;
                    }
                }
                case PAYLOAD_TYPE.BLOCK_ACTIONS: {
                    if (payload?.view?.callbackId === PAYLOAD_TYPE.POLL_INPUT) {
                        await this.slackService.updatePoll(payload);
                        res.status(HttpStatus.OK).send();
                    } else if (
                        payload?.container?.type === PAYLOAD_TYPE.MESSAGE
                    ) {
                        await this.slackService.updateMessage(payload);
                        res.status(HttpStatus.OK).send();
                    }
                }
                default: {
                    break;
                }
            }
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
