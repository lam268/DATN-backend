const today = new Date().toISOString().slice(0, 10);
const startTime = '09:00';
const endTime = '09:15';

export const absentBlock = {
    type: 'modal',
    callback_id: 'ar_input',
    notify_on_close: true,
    title: {
        type: 'plain_text',
        text: 'Yêu cầu xin nghỉ',
        emoji: true,
    },
    submit: {
        type: 'plain_text',
        text: 'Xác nhận',
        emoji: true,
    },
    close: {
        type: 'plain_text',
        text: 'Trở lại',
        emoji: true,
    },
    blocks: [
        {
            type: 'section',
            block_id: 'input',
            text: {
                type: 'mrkdwn',
                text: 'Hello, điền thông tin *yêu cầu xin nghỉ* của bạn',
            },
        },
        {
            type: 'divider',
        },
        {
            type: 'section',
            text: {
                type: 'plain_text',
                text: 'Chọn ngày bắt đầu và ngày kết thúc',
                emoji: true,
            },
        },
        {
            type: 'actions',
            block_id: 'datepicker',
            elements: [
                {
                    type: 'datepicker',
                    initial_date: `${today}`,
                    placeholder: {
                        type: 'plain_text',
                        text: 'Select a date',
                        emoji: true,
                    },
                    action_id: 'start_date',
                },
                {
                    type: 'datepicker',
                    initial_date: `${today}`,
                    placeholder: {
                        type: 'plain_text',
                        text: 'Select a date',
                        emoji: true,
                    },
                    action_id: 'end_date',
                },
            ],
        },
        {
            type: 'divider',
        },
        {
            type: 'section',
            text: {
                type: 'plain_text',
                text: 'Chọn giờ bắt đầu và giờ kết thúc',
                emoji: true,
            },
        },
        {
            type: 'actions',
            block_id: 'timepicker',
            elements: [
                {
                    type: 'timepicker',
                    initial_time: `${startTime}`,
                    placeholder: {
                        type: 'plain_text',
                        text: 'Select time',
                        emoji: true,
                    },
                    action_id: 'picker1',
                },
                {
                    type: 'timepicker',
                    initial_time: `${endTime}`,
                    placeholder: {
                        type: 'plain_text',
                        text: 'Select time',
                        emoji: true,
                    },
                    action_id: 'picker2',
                },
            ],
        },
        {
            type: 'divider',
        },
        {
            type: 'input',
            block_id: 'reason',
            element: {
                type: 'plain_text_input',
                multiline: true,
                action_id: 'input_reason',
            },
            label: {
                type: 'plain_text',
                text: 'Lý do xin nghỉ',
                emoji: true,
            },
        },
    ],
};
