import { readdirSync, unlinkSync } from 'fs';
import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import {
    DATE_TIME_FORMAT,
    FINGER_SCANNER_DATA_FILE_MAXIMUM_STORE_DAYS,
    TIMEZONE_NAME_DEFAULT,
} from 'src/common/constants';
import 'winston-daily-rotate-file';
import moment from 'moment-timezone';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { MODULE_NAME } from 'src/modules/recruitment/recruitment.constant';
import { Cron } from '@nestjs/schedule';

dotenv.config();
const {
    CRON_JOB_TIME_KEEPING_DELETE_FINGER_SCANNER_FILES,
    FINGER_SCANNER_DOWNLOAD_PATH,
} = process.env;

@Injectable()
export class DeleteFingerScannerDataFilesJob {
    constructor(private readonly configService: ConfigService) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `${MODULE_NAME}-delete-finger-scanner-job`,
        this.configService,
    );

    async deleteOldFingerScannerFiles() {
        const files = readdirSync(FINGER_SCANNER_DOWNLOAD_PATH);
        files.forEach((file: string) => {
            const filePath = `${FINGER_SCANNER_DOWNLOAD_PATH}/${file}`;
            const date = file.split('.')?.[0];
            if (
                moment(date, DATE_TIME_FORMAT.YYYY_MM_DD).isValid() &&
                moment().diff(moment(date), 'day') >
                    FINGER_SCANNER_DATA_FILE_MAXIMUM_STORE_DAYS
            ) {
                unlinkSync(filePath);
            }
        });
    }

    @Cron(CRON_JOB_TIME_KEEPING_DELETE_FINGER_SCANNER_FILES, {
        timeZone: TIMEZONE_NAME_DEFAULT,
    })
    async handleDeleteFingerScannerDataFiles() {
        try {
            this.logger.info(
                'start handleDeleteFingerScannerDataFiles at',
                new Date(),
            );
            this.deleteOldFingerScannerFiles();
        } catch (error) {
            this.logger.error(
                'Error in handleDeleteFingerScannerDataFiles: ',
                error,
            );
        }
    }
}
