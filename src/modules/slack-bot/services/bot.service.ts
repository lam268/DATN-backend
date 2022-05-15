/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { I18nRequestScopeService } from 'nestjs-i18n';
import ConfigKey from '../../../../src/common/config/config-key';
import { absentBlock } from '../blocks/absentBlock';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
    SLACK_URL,
    RESPONSE_TYPE,
    NUMBER,
    LIMIT,
    hourTimeStartBot,
    hourTimeEndBot,
} from '../bot.constants';
import { pollBlock } from '../blocks/pollBlock';
import { RequestAbsenceService } from '../../request-absence/services/requestAbsence.service';
import { EntityManager, Like } from 'typeorm';
import { pollMess } from '../blocks/pollMess';
import { readFileSync, writeFileSync } from 'fs';
import moment from '~plugins/moment';
import { DATE_TIME_FORMAT } from 'src/common/constants';
import { User } from 'src/modules/user/entity/user.entity';
import { IEvent, IInteractive } from '../bot.interface';
import { parseToSnakeCase } from 'src/common/helpers/common.function';
import { HttpStatus } from 'src/common/constants';
import { UserResponseDto } from 'src/modules/user/dto/response/user-response.dto';
import { RequestAbsenceStatus } from 'src/modules/request-absence/requestAbsence.constant';

@Injectable()
export class SlackService {
    constructor(
        @InjectEntityManager()
        private readonly dbManager: EntityManager,
        private readonly configService: ConfigService,
        private readonly requestAbsenceService: RequestAbsenceService,
        private readonly i18n: I18nRequestScopeService,
    ) {}

    async responseMessage(payload: IEvent) {
        const token = this.configService.get(ConfigKey.SLACK_BOT_TOKEN);
        const result = {
            channel: payload.user,
            text: await this.i18n.translate('slack-bot.default'),
        };
        try {
            const response = await axios.post(
                SLACK_URL.concat('/', RESPONSE_TYPE.CHAT_POSTMESSAGE),
                {
                    ...result,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return response;
        } catch (error) {
            throw error;
        }
    }

    async absenceRequest(data: IInteractive) {
        const token = this.configService.get(ConfigKey.SLACK_BOT_TOKEN);
        try {
            await axios.post(
                SLACK_URL.concat('/', RESPONSE_TYPE.VIEWS_OPEN),
                {
                    trigger_id: data.triggerId,
                    view: absentBlock,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
        } catch (error) {
            throw error;
        }
    }

    async responseAbsenceMessage(channel, msg) {
        const token = this.configService.get(ConfigKey.SLACK_BOT_TOKEN);
        const result = { channel: parseToSnakeCase(channel), text: msg };
        try {
            const response = await axios.post(
                SLACK_URL.concat('/', RESPONSE_TYPE.CHAT_POSTMESSAGE),
                {
                    ...result,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return response;
        } catch (error) {
            throw error;
        }
    }

    async resolveAbsenceRequest(payload) {
        const { user, view } = payload;
        const { values } = view?.state;
        const startDate = values?.datepicker?.startDate?.selectedDate;
        const endDate = values?.datepicker?.endDate?.selectedDate;
        const startTime = values?.timepicker?.picker1?.selectedTime;
        const endTime = values?.timepicker?.picker2?.selectedTime;
        const reason = values?.reason?.inputReason?.value;
        const userDetail = await this.dbManager.findOne(User, {
            select: ['id'],
            where: {
                email: Like(`${user.name}@%`),
            },
        });
        const timeStartCheck = +moment(
            `${startDate} ${startTime}`,
            DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON,
        ).fmHourOnlyTimeString();
        const timeEndCheck = +moment(
            `${endDate} ${endTime}`,
            DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON,
        ).fmHourOnlyTimeString();
        const startAt = moment(
            `${startDate} ${startTime}`,
            DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON,
        );
        const endAt = moment(
            `${endDate} ${endTime}`,
            DATE_TIME_FORMAT.YYYY_MM_DD_HYPHEN_HH_MM_SS_COLON,
        );
        const today = moment().unix();
        if (startAt.unix() < today) {
            return {
                status: HttpStatus.BAD_REQUEST,
                message: await this.i18n.translate(
                    'slack-bot.absence.form.inputPast',
                ),
            };
        }
        if (startAt.diff(endAt) >= 0) {
            return {
                status: HttpStatus.BAD_REQUEST,
                message: await this.i18n.translate(
                    'slack-bot.absence.form.inputWrong',
                ),
            };
        } else if (
            timeStartCheck < hourTimeStartBot ||
            timeEndCheck > hourTimeEndBot
        ) {
            return {
                status: HttpStatus.BAD_REQUEST,
                message: await this.i18n.translate(
                    'slack-bot.absence.form.timeOutside',
                ),
            };
        }
        try {
            const resultRequest =
                await this.requestAbsenceService.createRequestAbsence({
                    userId: userDetail.id,
                    reason: reason,
                    startAt: startAt.toDate(),
                    endAt: endAt.toDate(),
                    status: RequestAbsenceStatus.WAITING,
                    createdBy: userDetail.id,
                });
            if (!resultRequest) {
                return {
                    status: HttpStatus.BAD_REQUEST,
                    message: await this.i18n.translate(
                        'slack-bot.absence.form.timeDuplicate',
                    ),
                };
            }
            await this.responseAbsenceMessage(
                user.id,
                await this.i18n.translate('slack-bot.absence.success'),
            );
            return {
                status: HttpStatus.OK,
                message: 'success',
            };
        } catch (error) {
            throw error;
        }
    }

    async createPoll(data) {
        const token = this.configService.get(ConfigKey.SLACK_BOT_TOKEN);
        try {
            await axios.post(
                SLACK_URL.concat('/', RESPONSE_TYPE.VIEWS_OPEN),
                {
                    trigger_id: data.triggerId,
                    view: pollBlock,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
        } catch (error) {
            throw error;
        }
    }

    async resolvePollCreate(payload) {
        const { view } = payload;
        const { values } = view?.state;
        const channel = values?.channel?.channel?.selectedChannel;
        const token = this.configService.get(ConfigKey.SLACK_BOT_TOKEN);
        const question = values?.inputQuesion?.question?.value;
        let limit = values?.options.selected?.selectedOption.value;
        const lastOption = Object.keys(values)[Object.keys(values).length - 1];
        const option = [];
        for (
            let i = 1;
            i <= parseInt(lastOption.charAt(lastOption.length - 1));
            i++
        ) {
            option.push(values[`option${i}`][`option${i}`]?.value);
        }
        const blocks = [...pollMess(question, option, limit)];
        limit += `\n${option.join()}`;
        limit += '\n{';
        for (let i = 0; i < option.length - 1; i++) {
            limit += `"${NUMBER[i]}": [],`;
        }
        limit += `"${NUMBER[option.length - 1]}": []}`;
        writeFileSync(`logs/${question.split(' ').join('')}.log`, limit);
        const message = await this.i18n.translate('slack-bot.poll.created');
        try {
            const response = await axios.post(
                SLACK_URL.concat('/', RESPONSE_TYPE.CHAT_POSTMESSAGE),
                {
                    channel: parseToSnakeCase(channel),
                    text: message,
                    blocks: [...blocks],
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return {
                status: response.status,
            };
        } catch (error) {
            throw error;
        }
    }

    async updateMessage(data) {
        const { message, container, user, actions } = data;
        const token = this.configService.get(ConfigKey.SLACK_BOT_TOKEN);
        const question = message.blocks[0]?.text?.text.split('*')[1].split(' ');
        question.pop();
        const file = readFileSync(
            `logs/${question.join('')}.log`,
            'utf8',
        ).split('\n');
        let limit = file.shift();
        const options = file.shift().split(',');
        const option = JSON.parse(file[0]);
        const blocks = [...pollMess(question.join(' '), options, limit)];
        const value = NUMBER.indexOf(actions[0].value);
        const index = option[`${NUMBER[value]}`].indexOf(user.name);
        if (index !== -1) {
            option[`${NUMBER[value]}`].splice(index, 1);
        } else {
            if (limit === LIMIT.LIMIT_ONE) {
                for (let i = 0; i < Object.keys(option).length; i++) {
                    const index = option[`${NUMBER[i]}`].indexOf(user.name);
                    if (index !== -1) {
                        option[`${NUMBER[i]}`].splice(index, 1);
                    }
                }
                option[`${NUMBER[value]}`].push(user.name);
            } else {
                option[`${NUMBER[value]}`].push(user.name);
            }
        }
        limit += `\n${options.join()}`;
        limit += '\n';
        limit += JSON.stringify(option);
        writeFileSync(`logs/${question.join('')}.log`, limit);
        blocks.forEach((item) => {
            const value = item?.accessory?.value;
            if (value) {
                const len = option[`${value}`].length;
                if (len > 0) {
                    item.text.text += ' `';
                    item.text.text += `${len}`;
                    item.text.text += '`\n';
                    option[`${value}`].forEach((i) => {
                        item.text.text += `@${i} `;
                    });
                }
            }
        });
        try {
            const result = await axios.post(
                SLACK_URL.concat('/', RESPONSE_TYPE.CHAT_UPDATE),
                {
                    channel: container?.channelId,
                    ts: container?.messageTs,
                    blocks: [...blocks],
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return {
                status: result.status,
            };
        } catch (error) {
            throw error;
        }
    }

    async updatePoll(data) {
        const token = this.configService.get(ConfigKey.SLACK_BOT_TOKEN);
        const blocks = [...data?.view.blocks];
        const cloneView = JSON.parse(JSON.stringify(pollBlock));
        let lastOption = blocks[blocks.length - 2]?.label?.text.split(' ')[1];
        lastOption++;
        blocks.splice(blocks.length - 1, 0, {
            type: 'input',
            blockId: `option${lastOption}`,
            element: {
                type: 'plain_text_input',
                actionId: `option${lastOption}`,
            },
            label: {
                type: 'plain_text',
                text: `Options ${lastOption} (optional)`,
                emoji: true,
            },
        });
        cloneView.blocks = [...blocks];
        try {
            await axios.post(
                SLACK_URL.concat('/', RESPONSE_TYPE.VIEWS_UPDATE),
                {
                    trigger_id: data.triggerId,
                    view_id: data?.view?.id,
                    view: parseToSnakeCase(cloneView),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
        } catch (error) {
            throw error;
        }
    }

    async sendRequestAbsence(
        startAt: Date,
        endAt: Date,
        user: UserResponseDto,
    ) {
        try {
            const token = this.configService.get(ConfigKey.SLACK_BOT_TOKEN);
            const startDay = moment(startAt).add(7, 'h').fmFullTimeString();
            const endDay = moment(endAt).add(7, 'h').fmFullTimeString();
            const response = await axios.get(
                `${SLACK_URL}/${RESPONSE_TYPE.USER_LOOKUP}`,
                {
                    params: {
                        email: user.email,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const result = {
                channel: this.configService.get(
                    ConfigKey.SLACK_TIMEKEEPING_CHANNEL,
                ),

                text: '',
            };
            if (response?.data?.user) {
                result.text = await this.i18n.translate(
                    'slack-bot.absence.request',
                    {
                        args: {
                            adminId: this.configService.get(
                                ConfigKey.SLACK_ADMIN_ID,
                            ),
                            user: `<@${response.data?.user?.id}>`,
                            startDay,
                            endDay,
                        },
                    },
                );
            } else {
                result.text = await this.i18n.translate(
                    'slack-bot.absence.request',
                    {
                        args: {
                            adminId: this.configService.get(
                                ConfigKey.SLACK_ADMIN_ID,
                            ),
                            user: user.fullName,
                            startDay,
                            endDay,
                        },
                    },
                );
            }
            const sendMessageResponse = await axios.post(
                SLACK_URL.concat('/', RESPONSE_TYPE.CHAT_POSTMESSAGE),
                {
                    ...result,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return sendMessageResponse;
        } catch (error) {
            throw error;
        }
    }

    async sendAbsenceStatusUpdateMessage(
        email: string,
        status: RequestAbsenceStatus,
    ) {
        try {
            const token = this.configService.get(ConfigKey.SLACK_BOT_TOKEN);
            const msg =
                status === RequestAbsenceStatus.APPROVED
                    ? await this.i18n.translate('slack-bot.absence.approved')
                    : await this.i18n.translate('slack-bot.absence.rejected');
            const getUser = await axios.get(
                `${SLACK_URL}/${RESPONSE_TYPE.USER_LOOKUP}`,
                {
                    params: {
                        email,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const result = { channel: getUser.data?.user?.id, text: msg };
            const response = await axios.post(
                SLACK_URL.concat('/', RESPONSE_TYPE.CHAT_POSTMESSAGE),
                {
                    ...result,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return response;
        } catch (error) {
            throw error;
        }
    }
}
