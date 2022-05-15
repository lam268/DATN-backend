import { NUMBER, LIMIT } from '../bot.constants';

export function pollMess(question: string, option, limit) {
    const blocks = [];
    const msg =
        limit === LIMIT.NO_LIMIT
            ? 'được chọn thoải mái nha'
            : 'chỉ được chọn 1 thui ạ';
    blocks.push(
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `Xin chào, Siêu nhân cần biết câu trả lời của bạn (${msg}) :interrobang:\n\n *${question} :*`,
            },
        },
        {
            type: 'divider',
        },
    );
    option.forEach((item) =>
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `:${NUMBER[option.indexOf(item)]}: ${item}`,
            },
            accessory: {
                type: 'button',
                text: {
                    type: 'plain_text',
                    text: `:${NUMBER[option.indexOf(item)]}:`,
                    emoji: true,
                },
                value: `${NUMBER[option.indexOf(item)]}`,
                action_id: `button-${NUMBER[option.indexOf(item)]}`,
            },
        }),
    );
    return blocks;
}
