const puppeteer = require('puppeteer');
const fs = require('fs');
const config = require('dotenv').config();

const DOWNLOAD_LINK = config.parsed.FINGER_SCANNER_DOWNLOAD_LINK;
const LOGIN_LINK = config.parsed.FINGER_SCANNER_LOGIN_LINK;
const USERNAME_FINGER_SCANNER = config.parsed.FINGER_SCANNER_USERNAME;
const PASSWORD_FINGER_SCANNER = config.parsed.FINGER_SCANNER_PASSWORD;
const FINGER_SCANNER_FILE_NAME = config.parsed.FINGER_SCANNER_FILE_NAME;
const FINGER_SCANNER_DOWNLOAD_PATH = config.parsed.FINGER_SCANNER_DOWNLOAD_PATH;

const USERNAME_INPUT_QUERY_SELECTOR = 'input[name=username]';
const PASSWORD_INPUT_QUERY_SELECTOR = 'input[name=userpwd]';
const SUBMIT_FORM_QUERY_SELECTOR =
    'body > center > table.Menu > tbody > tr:nth-child(5) > td > input[type=submit]:nth-child(1)';
const DOWNLOAD_BUTTON_QUERY_SELECTOR =
    'body > table:nth-child(4) > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(3) > td:nth-child(2) > input';
const START_DATE_QUERY_SELECTOR =
    'body > table:nth-child(4) > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(1) > td:nth-child(2) > input:nth-child(2)';
const END_DATE_QUERY_SELECTOR =
    'body > table:nth-child(4) > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(1) > td:nth-child(2) > input:nth-child(4)';
const MAX_LOGIN_TRY = 10;

async function downloadFile(strDates) {
    try {
        const dates = strDates.split(',');
        const browser = await puppeteer.launch({
            headless: true,
        });
        const page = await browser.newPage();
        await page.goto(LOGIN_LINK, { waitUntil: 'domcontentloaded' });

        const login = async () => {
            await Promise.all([
                page.waitForSelector(USERNAME_INPUT_QUERY_SELECTOR),
                page.waitForSelector(PASSWORD_INPUT_QUERY_SELECTOR),
                page.waitForSelector(SUBMIT_FORM_QUERY_SELECTOR),
            ]);
            await Promise.all([
                page.type(
                    USERNAME_INPUT_QUERY_SELECTOR,
                    USERNAME_FINGER_SCANNER,
                ),
                page.type(
                    PASSWORD_INPUT_QUERY_SELECTOR,
                    PASSWORD_FINGER_SCANNER,
                ),
            ]);
            await page.click(SUBMIT_FORM_QUERY_SELECTOR);
            await page.waitForTimeout(3000);
            if (await page.$(USERNAME_INPUT_QUERY_SELECTOR)) {
                await page.goto(LOGIN_LINK, { waitUntil: 'domcontentloaded' });
            }
        };

        let loginCount = 0;
        while (
            (await page.$(USERNAME_INPUT_QUERY_SELECTOR)) &&
            loginCount < MAX_LOGIN_TRY
        ) {
            await login();
            ++loginCount;
        }
        await page.goto(DOWNLOAD_LINK, { waitUntil: 'domcontentloaded' });
        await Promise.all([
            page.waitForSelector(START_DATE_QUERY_SELECTOR),
            page.waitForSelector(END_DATE_QUERY_SELECTOR),
            page.waitForSelector(DOWNLOAD_BUTTON_QUERY_SELECTOR),
        ]);

        for (let i = 0; i < dates.length; ++i) {
            await Promise.all([
                page.evaluate(
                    (querySelector, value) =>
                        (document.querySelector(querySelector).value = value),
                    START_DATE_QUERY_SELECTOR,
                    dates[i],
                ),
                page.evaluate(
                    (querySelector, value) =>
                        (document.querySelector(querySelector).value = value),
                    END_DATE_QUERY_SELECTOR,
                    dates[i],
                ),
            ]);
            await page._client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: FINGER_SCANNER_DOWNLOAD_PATH,
            });
            await page.click(DOWNLOAD_BUTTON_QUERY_SELECTOR);
            await page.waitForTimeout(2000);
            renameDownloadedFingerScannerFile(dates[i]);
        }
        await browser.close();
    } catch (error) {
        throw error;
    }
}

function renameDownloadedFingerScannerFile(newName) {
    const filePath = `${FINGER_SCANNER_DOWNLOAD_PATH}/${FINGER_SCANNER_FILE_NAME}`;
    if (fs.existsSync(filePath)) {
        const fileNameSplited = FINGER_SCANNER_FILE_NAME.split('.');
        const fileExtension = fileNameSplited[1];
        fs.renameSync(
            filePath,
            `${FINGER_SCANNER_DOWNLOAD_PATH}/${newName}.${fileExtension}`,
        );
    }
}

(async () => {
    await downloadFile(process.argv[2]);
})();
