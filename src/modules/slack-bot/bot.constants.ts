export const SLACK_URL = process.env.SLACK_URL;

export const PAYLOAD_TYPE = {
    APP_MENTION: 'app_mention',
    SHORTCUT: 'shortcut',
    VIEW_SUBMISSION: 'view_submission',
    VIEW_CLOSED: 'view_closed',
    CREATE_POLL: 'create_poll',
    ABSENT_REQUEST: 'absent_request',
    BLOCK_ACTIONS: 'block_actions',
    AR_INPUT: 'ar_input',
    POLL_INPUT: 'poll_input',
    MESSAGE: 'message',
    BUTTON: 'button',
};

export const RESPONSE_TYPE = {
    CHAT_POSTMESSAGE: 'chat.postMessage',
    CHAT_POSTEPHEMERAL: 'chat.postEphemeral',
    VIEWS_OPEN: 'views.open',
    VIEWS_PUSH: 'views.push',
    VIEWS_UPDATE: 'views.update',
    CHAT_UPDATE: 'chat.update',
    USER_LOOKUP: 'users.lookupByEmail',
};

export const LIMIT = {
    NO_LIMIT: 'no_limit',
    LIMIT_ONE: 'limit_1',
};

export const NUMBER = [
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
];

export const hourTimeStartBot = 9;

export const hourTimeEndBot = 18;
