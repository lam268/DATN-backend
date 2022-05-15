export const pollBlock = {
    type: 'modal',
    callback_id: 'poll_input',
    notify_on_close: true,
    title: {
        type: 'plain_text',
        text: 'Create Poll',
        emoji: true,
    },
    submit: {
        type: 'plain_text',
        text: 'Post',
        emoji: true,
    },
    close: {
        type: 'plain_text',
        text: 'Cancel',
        emoji: true,
    },
    blocks: [
        {
            type: 'input',
            block_id: 'channel',
            element: {
                type: 'channels_select',
                placeholder: {
                    type: 'plain_text',
                    text: 'Select a channel',
                    emoji: true,
                },
                action_id: 'channel',
            },
            label: {
                type: 'plain_text',
                text: 'Channel to post the poll in',
                emoji: true,
            },
        },
        {
            type: 'input',
            block_id: 'inputQuesion',
            element: {
                type: 'plain_text_input',
                action_id: 'question',
                placeholder: {
                    type: 'plain_text',
                    text: 'Which day works best for the weekly meeting',
                    emoji: true,
                },
            },
            label: {
                type: 'plain_text',
                text: 'Question or Topic',
                emoji: true,
            },
        },
        {
            type: 'input',
            block_id: 'options',
            element: {
                type: 'static_select',
                placeholder: {
                    type: 'plain_text',
                    text: 'Pick an option',
                    emoji: true,
                },
                options: [
                    {
                        text: {
                            type: 'plain_text',
                            text: 'No limit',
                            emoji: true,
                        },
                        value: 'no_limit',
                    },
                    {
                        text: {
                            type: 'plain_text',
                            text: 'Limit to 1 vote per person',
                            emoji: true,
                        },
                        value: 'limit_1',
                    },
                ],
                action_id: 'selected',
            },
            label: {
                type: 'plain_text',
                text: 'Limit number of votes per respondent',
                emoji: true,
            },
        },
        {
            type: 'input',
            block_id: 'option1',
            element: {
                type: 'plain_text_input',
                action_id: 'option1',
            },
            label: {
                type: 'plain_text',
                text: 'Option 1',
                emoji: true,
            },
        },
        {
            type: 'input',
            block_id: 'option2',
            element: {
                type: 'plain_text_input',
                action_id: 'option2',
            },
            label: {
                type: 'plain_text',
                text: 'Option 2',
                emoji: true,
            },
        },
        {
            type: 'actions',
            elements: [
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: 'Add more option',
                        emoji: true,
                    },
                    action_id: 'add_options',
                },
            ],
        },
    ],
};
