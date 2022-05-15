import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { TIMEZONE_NAME_DEFAULT } from 'src/common/constants';
import 'winston-daily-rotate-file';
import * as child from 'child_process';
import path from 'path';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { MODULE_NAME } from 'src/modules/recruitment/recruitment.constant';
import { Cron } from '@nestjs/schedule';
import { TimekeepingService } from '../services/timekeeping.service';

dotenv.config();
const { CRON_JOB_TIME_KEEPING_DOWNLOAD_FINGER_SCANNER_DATA } = process.env;

@Injectable()
export class DownloadFingerScannerDataJob {
    constructor(
        private readonly configService: ConfigService,
        private readonly timekeepingService: TimekeepingService,
    ) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `${MODULE_NAME}-download-finger-scanner-job`,
        this.configService,
    );

    async downloadFile(dates: string) {
        await child.exec(
            `yarn download-file ${dates}`,
            {
                cwd: path.resolve('./'),
            },
            (error) => {
                if (error) {
                    this.logger.error('Cannot download file....');
                } else {
                    this.logger.info('Download file successful....');
                }
            },
        );
    }

    @Cron(CRON_JOB_TIME_KEEPING_DOWNLOAD_FINGER_SCANNER_DATA, {
        timeZone: TIMEZONE_NAME_DEFAULT,
    })
    async downloadFingerScannerFile() {
        try {
            this.logger.info('start downloadFingerScannerFile at', new Date());
            const unprocessedDates =
                await this.timekeepingService.getUnprocessedDates();
            await this.downloadFile(unprocessedDates.join(','));
        } catch (error) {
            this.logger.error('Error in downloadFingerScannerFile: ', error);
        }
    }
}
