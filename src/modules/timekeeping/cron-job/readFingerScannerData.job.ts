import { readFileSync, existsSync } from 'fs';
import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import groupBy from 'lodash/groupBy';
import {
    TIMEZONE_NAME_DEFAULT,
    TOKYOTECHBAB_DOMAIN,
} from 'src/common/constants';
import 'winston-daily-rotate-file';
import moment from 'moment-timezone';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { MODULE_NAME } from 'src/modules/recruitment/recruitment.constant';
import { Cron } from '@nestjs/schedule';
import { Timekeeping } from '../entity/timekeeping.entity';
import { EntityManager, In } from 'typeorm';
import { User } from 'src/modules/user/entity/user.entity';
import { userDetailAttributes, dat } from '../timekeeping.constant';
import { TimekeepingService } from '../services/timekeeping.service';
import { FingerScannerData } from '../entity/finger-scanner-data.entity';

dotenv.config();
const {
    CRON_JOB_TIME_KEEPING_READ_FINGER_SCANNER_DATA,
    FINGER_SCANNER_DOWNLOAD_PATH,
} = process.env;

interface IUserFingerData {
    email: string;
    checkIn: string;
    checkOut: string | null;
    userId: number;
}
interface IFingerDataScanner {
    fingerId: number;
    username: string;
    email: string;
    scanAt: string;
    userId?: number;
}

@Injectable()
export class ReadFingerScannerDataJob {
    constructor(
        private readonly configService: ConfigService,
        private readonly dbManager: EntityManager,
        private readonly timekeepingService: TimekeepingService,
    ) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `${MODULE_NAME}-read-finger-scanner-job`,
        this.configService,
    );

    async mapUserIds(
        data: IFingerDataScanner[],
    ): Promise<IFingerDataScanner[]> {
        try {
            const userEmails = data.map((user) => user.email);
            const users = await this.getUserList(userEmails);
            return data
                .filter((fingerScannerData) =>
                    users.has(fingerScannerData.email),
                )
                .map((fingerScannerData) => ({
                    ...fingerScannerData,
                    userId: users.get(fingerScannerData.email),
                }));
        } catch (error) {
            throw error;
        }
    }

    async mapCheckinAndCheckoutToUser(
        data: IFingerDataScanner[],
    ): Promise<IUserFingerData[]> {
        const fingerScannerDataGroupByUser = groupBy(data, 'email');
        return Object.keys(fingerScannerDataGroupByUser).map((email) => {
            const fingerScannerData = fingerScannerDataGroupByUser[email];
            fingerScannerData.sort((fingerScannerDataA, fingerScannerDataB) => {
                return moment(fingerScannerDataA.scanAt).diff(
                    fingerScannerDataB.scanAt,
                    'second',
                );
            });
            return {
                checkIn: fingerScannerData?.[0]?.scanAt,
                checkOut:
                    fingerScannerData.length > 1 &&
                    fingerScannerData?.[fingerScannerData.length - 1]?.scanAt,
                email: fingerScannerData?.[0].email,
                userId: fingerScannerData?.[0].userId,
            };
        });
    }

    parseFingerScannerDataFile(path): IFingerDataScanner[] {
        const rows = readFileSync(path, 'utf-8').toString().split('\n');

        const data: IFingerDataScanner[] = [];

        for (const line of rows) {
            if (line) {
                const rowData = line.replace(/\s+/g, ' ').split(' ');
                const email = `${rowData[1]?.toLowerCase()}${TOKYOTECHBAB_DOMAIN}`;
                data.push({
                    fingerId: +rowData[0],
                    username: rowData[1]?.toLowerCase(),
                    scanAt: `${rowData[2]} ${rowData[3]}`,
                    email,
                });
            }
        }
        return data;
    }

    async getUserList(emails: string[]) {
        const users = await this.dbManager.find(User, {
            where: (queryBuilder) => {
                if (emails.length) {
                    queryBuilder.where({ email: In(emails) });
                }
            },
            select: userDetailAttributes,
        });
        const mapUserEmailToId = new Map<string, number>();
        users.forEach((user) => {
            mapUserEmailToId.set(user.email, user.id);
        });
        return mapUserEmailToId;
    }

    async importFingerData(data: IFingerDataScanner[]) {
        try {
            const fingerScannerData = data.map((fingerScanner) => ({
                username: fingerScanner.username,
                scanAt: fingerScanner.scanAt,
                userId: fingerScanner.userId,
                fingerId: fingerScanner.fingerId,
            }));

            await this.dbManager
                .getRepository(FingerScannerData)
                .insert(fingerScannerData);
        } catch (error) {
            throw error;
        }
    }

    async processFingerData(data: IFingerDataScanner[]) {
        try {
            const parsedData = await this.mapCheckinAndCheckoutToUser(data);
            const timekeepings = parsedData.map((user) => ({
                userId: user.userId,
                checkIn: moment
                    .tz(user.checkIn, TIMEZONE_NAME_DEFAULT)
                    .utc()
                    .fmFullTimeString(),
                checkOut: user.checkOut
                    ? moment
                          .tz(user.checkOut, TIMEZONE_NAME_DEFAULT)
                          .utc()
                          .fmFullTimeString()
                    : null,
                scanAt: moment
                    .tz(user.checkIn, TIMEZONE_NAME_DEFAULT)
                    .startOfDay()
                    .utc()
                    .fmFullTimeString(),
            }));

            await this.dbManager
                .getRepository(Timekeeping)
                .insert(timekeepings);
        } catch (error) {
            throw error;
        }
    }

    @Cron(CRON_JOB_TIME_KEEPING_READ_FINGER_SCANNER_DATA, {
        timeZone: TIMEZONE_NAME_DEFAULT,
    })
    async readFingerScanner() {
        try {
            this.logger.info('start readFingerScanner at', new Date());

            const unprocessedDates =
                await this.timekeepingService.getUnprocessedDates();

            for (let i = 0; i < unprocessedDates.length; ++i) {
                const filePath = `${FINGER_SCANNER_DOWNLOAD_PATH}/${unprocessedDates[i]}.${dat}`;
                if (existsSync(filePath)) {
                    const userScannedData =
                        this.parseFingerScannerDataFile(filePath);
                    if (!userScannedData) {
                        return;
                    }

                    const userData = await this.mapUserIds(userScannedData);
                    await Promise.all([
                        this.importFingerData(userData),
                        this.processFingerData(userData),
                    ]);
                }
            }
        } catch (error) {
            this.logger.error('Error in readFingerScanner: ', error);
        }
    }
}
