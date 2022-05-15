import { forwardRef, Inject, Injectable, Optional } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Request } from 'express';
import * as ExcelJS from 'exceljs';
import isNumber from 'lodash/isNumber';
import { WORKING_HOUR_PER_DAY } from 'src/common/constants';
import { User } from 'src/modules/user/entity/user.entity';
import { UserService } from 'src/modules/user/services/user.service';
import { EntityManager, In } from 'typeorm';
import { bool } from 'aws-sdk/clients/signer';
import {
    DAYS_IN_WEEK_OF_EXCEL_TABLE,
    TIME_KEEPING_EXCEL_DATA_SIGN,
} from '../timekeeping.constant';
export const notDateProperties = [
    'userId',
    'fullName',
    'position',
    'paidLeaveHours',
];
const generalInfoColumnNumber = 3;

function getDayString(day: number) {
    switch (day) {
        case 0:
            return DAYS_IN_WEEK_OF_EXCEL_TABLE.SUNDAY;
        case 1:
            return DAYS_IN_WEEK_OF_EXCEL_TABLE.MONDAY;
        case 2:
            return DAYS_IN_WEEK_OF_EXCEL_TABLE.TUESDAY;
        case 3:
            return DAYS_IN_WEEK_OF_EXCEL_TABLE.WEDNESDAY;
        case 4:
            return DAYS_IN_WEEK_OF_EXCEL_TABLE.THURSDAY;
        case 5:
            return DAYS_IN_WEEK_OF_EXCEL_TABLE.FRIDAY;
        case 6:
            return DAYS_IN_WEEK_OF_EXCEL_TABLE.SATURDAY;
        default:
            return '';
    }
}

export async function getExcelHeader(
    ws: ExcelJS.Worksheet,
    month: number,
    year: number,
    daysInMonth: number,
) {
    const excelHeaderRowsHeight = 25;
    const officeNameRow = ws.addRow([
        'CÔNG TY CỔ PHẦN TOKYO TECH LAB VIỆT NAM',
    ]);
    officeNameRow.height = excelHeaderRowsHeight;
    officeNameRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = {
            bold: true,
        };
    });
    ws.addRow([
        'Địa chỉ: Tầng 2 - CT3, tòa nhà Yên Hòa Park View, số 3 Vũ Phạm Hàm, P. Yên Hòa, Q. Cầu Giấy, Hà Nội, Việt Nam',
    ]).height = excelHeaderRowsHeight;
    ws.addRow(['MST: 0108849180']).height = excelHeaderRowsHeight;
    const titleRow = ws.addRow([`BẢNG CHẤM CÔNG THÁNG ${month}/${year}.`]);
    titleRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = {
            bold: true,
            size: 30,
        };
        cell.alignment = {
            horizontal: 'center',
        };
    });
    ws.mergeCells(
        `${titleRow.getCell(1).address}:${
            titleRow.getCell(daysInMonth + generalInfoColumnNumber).address
        }`,
    );
    ws.addRow([]);
}

export async function getTimeKeepingDataHeader(
    ws: ExcelJS.Worksheet,
    excelData: any[],
    daysInMonth: number,
    holidayDateList: string[],
    weekendIndexes: string[],
) {
    // table header
    const holidayIndexes = [];
    const actualWorkingHoursOfMonth = daysInMonth + 4;
    const paidLeaveHoursOfMonthCol = daysInMonth + 5;
    const unpaidLeaveHoursOfMonthCol = daysInMonth + 6;
    const workingHoursOfMonthCol = daysInMonth + 7;
    const keysByDay = Object.keys(excelData[0]).map((item, index) => {
        if (holidayDateList.includes(item)) {
            holidayIndexes.push(index + 1);
        }
        return getDayString(new Date(item).getDay());
    });
    const keysByDate = Object.keys(excelData[0]).map((item) => {
        return new Date(item).getDate();
    });
    const tableHeadRow = ws.addRow([
        'TT',
        'Họ và tên',
        'Chức vụ',
        'CÁC NGÀY THÁNG/THỨ TRONG TUẦN',
    ]);
    ws.mergeCells(
        `${tableHeadRow.getCell(generalInfoColumnNumber + 1).address}:${
            tableHeadRow.getCell(daysInMonth + generalInfoColumnNumber).address
        }`,
    );
    tableHeadRow.getCell(daysInMonth + 4).value = 'Tổng giờ công theo tháng';
    ws.mergeCells(
        `${tableHeadRow.getCell(daysInMonth + 4).address}:${
            tableHeadRow.getCell(daysInMonth + 7).address
        }`,
    );
    const excelKeysByDateRows = ws.addRow(keysByDate);
    excelKeysByDateRows.getCell(actualWorkingHoursOfMonth).value =
        'Tổng số giờ làm thực tế';
    excelKeysByDateRows.getCell(paidLeaveHoursOfMonthCol).value =
        'Số giờ nghỉ vẫn hưởng lương';
    excelKeysByDateRows.getCell(unpaidLeaveHoursOfMonthCol).value =
        'Số giờ nghỉ không lương';
    excelKeysByDateRows.getCell(workingHoursOfMonthCol).value =
        'Giờ công phải làm trong tháng';
    const excelKeysByDayRows = ws.addRow(keysByDay);
    // mergeCells for table header
    for (let i = 1; i < generalInfoColumnNumber + 1; i++) {
        ws.mergeCells(
            `${tableHeadRow.getCell(i).address}:${
                excelKeysByDayRows.getCell(i).address
            }`,
        );
    }
    ws.mergeCells(
        `${excelKeysByDateRows.getCell(actualWorkingHoursOfMonth).address}:${
            excelKeysByDayRows.getCell(actualWorkingHoursOfMonth).address
        }`,
    );
    ws.mergeCells(
        `${excelKeysByDateRows.getCell(paidLeaveHoursOfMonthCol).address}:${
            excelKeysByDayRows.getCell(paidLeaveHoursOfMonthCol).address
        }`,
    );
    ws.mergeCells(
        `${excelKeysByDateRows.getCell(unpaidLeaveHoursOfMonthCol).address}:${
            excelKeysByDayRows.getCell(unpaidLeaveHoursOfMonthCol).address
        }`,
    );
    ws.mergeCells(
        `${excelKeysByDateRows.getCell(workingHoursOfMonthCol).address}:${
            excelKeysByDayRows.getCell(workingHoursOfMonthCol).address
        }`,
    );
    // style
    tableHeadRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.style = {
            ...commonDataTableStyle,
            alignment: {
                ...commonDataTableStyle.alignment,
                vertical: 'middle',
            },
        };
    });
    excelKeysByDayRows.eachCell({ includeEmpty: true }, (cell) => {
        cell.style = {
            ...commonDataTableStyle,
        };
        if (weekendIndexes.includes(cell.col.toString())) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'A6C4C9' },
            };
        }
        if (holidayIndexes.includes(cell.col)) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFF0F5' },
            };
        }
    });
    excelKeysByDateRows.eachCell({ includeEmpty: true }, (cell) => {
        cell.style = {
            ...commonDataTableStyle,
        };
    });
    const titleRowsHeight = 40;
    excelKeysByDayRows.height = titleRowsHeight;
    tableHeadRow.height = titleRowsHeight;
    excelKeysByDateRows.height = titleRowsHeight;
}

export async function getTimeKeepingDataTable(
    ws: ExcelJS.Worksheet,
    excelData: any[],
    daysInMonth: number,
    holidayDateList: string[],
    holidayIndexes: string[],
    weekendIndexes: string[],
) {
    const actualWorkingHoursOfMonth = daysInMonth + 4;
    const paidLeaveHoursOfMonthCol = daysInMonth + 5;
    const unpaidLeaveHoursOfMonthCol = daysInMonth + 6;
    const workingHoursOfMonthCol = daysInMonth + 7;
    excelData.forEach((rowData, index) => {
        let leaveHoursOfMonth = 0;
        let authorizedLeaveHoursOfMonth = 0;
        let paidLeaveHoursOfMonth = 0;
        let workingHoursOfMonth = 0;
        for (const property in rowData) {
            if (!notDateProperties.includes(property)) {
                if (
                    getDayString(new Date(property).getDay()) ===
                        DAYS_IN_WEEK_OF_EXCEL_TABLE.SATURDAY ||
                    getDayString(new Date(property).getDay()) ===
                        DAYS_IN_WEEK_OF_EXCEL_TABLE.SUNDAY ||
                    holidayDateList.includes(property)
                ) {
                    rowData[property] = '';
                } else {
                    workingHoursOfMonth += WORKING_HOUR_PER_DAY;
                }
                leaveHoursOfMonth +=
                    (rowData[property]?.unauthorizedLeaveHours || 0) +
                    (rowData[property]?.authorizedLeaveHours || 0);
                authorizedLeaveHoursOfMonth +=
                    rowData[property]?.authorizedLeaveHours || 0;
                if (authorizedLeaveHoursOfMonth >= rowData.paidLeaveHours) {
                    paidLeaveHoursOfMonth = rowData.paidLeaveHours | 0;
                } else {
                    paidLeaveHoursOfMonth = authorizedLeaveHoursOfMonth;
                }
                if (
                    (rowData[property]?.workingHours || 0) ==
                    WORKING_HOUR_PER_DAY
                ) {
                    rowData[property] =
                        TIME_KEEPING_EXCEL_DATA_SIGN.FULL_TIME_WORK;
                } else if ((rowData[property]?.workingHours || 0) === 0) {
                    switch (rowData[property]?.unauthorizedLeaveHours) {
                        case 0: {
                            rowData[property] =
                                TIME_KEEPING_EXCEL_DATA_SIGN.AUTHORIZED_FULL_DAY_LEAVE;
                            break;
                        }
                        case WORKING_HOUR_PER_DAY: {
                            rowData[property] =
                                TIME_KEEPING_EXCEL_DATA_SIGN.UNAUTHORIZED_FULL_DAY_LEAVE;
                            break;
                        }
                        default: {
                            rowData[property] = rowData[property]?.workingHours;
                            break;
                        }
                    }
                } else {
                    rowData[property] = rowData[property]?.workingHours;
                }
            }
            // set value = STT if column is 'userId'
            if (property === 'userId') {
                rowData[property] = index + 1;
            }
        }
        rowData.actualWorkingHoursOfMonth =
            workingHoursOfMonth - leaveHoursOfMonth;
        rowData.paidLeaveHoursOfMonth = paidLeaveHoursOfMonth;
        rowData.unpaidLeaveHoursOfMonth =
            leaveHoursOfMonth - paidLeaveHoursOfMonth;
        rowData.workingHoursOfMonth = workingHoursOfMonth;
        delete rowData.paidLeaveHours;
        const dataTableRows = ws.addRow(Object.values(rowData));
        dataTableRows.height = 35;
        dataTableRows.eachCell({ includeEmpty: true }, (cell) => {
            cell.style = {
                ...commonDataTableStyle,
            };
            if (weekendIndexes.includes(cell.col.toString())) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'A6C4C9' },
                };
            } else if (holidayIndexes.includes(cell.col.toString())) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFF0F5' },
                };
            }
            if (
                isNumber(cell.value) &&
                parseInt(cell.col) > 3 &&
                parseInt(cell.col) < daysInMonth + 3
            ) {
                cell.font = {
                    color: {
                        argb: 'FF0000',
                    },
                };
            }
            if (
                isNumber(cell.value) &&
                (cell.col == actualWorkingHoursOfMonth.toString() ||
                    cell.col == paidLeaveHoursOfMonthCol.toString() ||
                    cell.col == unpaidLeaveHoursOfMonthCol.toString() ||
                    cell.col == workingHoursOfMonthCol.toString())
            ) {
                cell.font = {
                    bold: true,
                };
            }
        });
    });
}

export async function getTimeKeepingData(
    ws: ExcelJS.Worksheet,
    excelData: any[],
    daysInMonth: number,
    holidayDateList: string[],
    holidayIndexes: string[],
    weekendIndexes: string[],
) {
    getTimeKeepingDataHeader(
        ws,
        excelData,
        daysInMonth,
        holidayDateList,
        weekendIndexes,
    );
    getTimeKeepingDataTable(
        ws,
        excelData,
        daysInMonth,
        holidayDateList,
        holidayIndexes,
        weekendIndexes,
    );
}

export const commonDataTableStyle: Partial<ExcelJS.Style> = {
    alignment: {
        horizontal: 'center',
        wrapText: true,
    },
    border: {
        top: {
            style: 'thin',
        },
        left: {
            style: 'thin',
        },
        bottom: {
            style: 'thin',
        },
        right: {
            style: 'thin',
        },
        diagonal: {
            style: 'thin',
        },
    },
};

@Injectable()
export class ExportExcelService {
    constructor(
        @Optional() @Inject(REQUEST) private readonly request: Request,
        @InjectEntityManager()
        @Inject(forwardRef(() => UserService))
        private readonly dbManager: EntityManager,
    ) {}

    async checkListUsersExisted(userIds: number[]): Promise<bool> {
        try {
            const where = {
                id: In(userIds),
            };
            const usersCount = await this.dbManager.count(User, {
                where,
            });
            return usersCount === userIds.length;
        } catch (error) {
            throw error;
        }
    }
}
