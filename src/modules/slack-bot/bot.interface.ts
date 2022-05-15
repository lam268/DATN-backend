export interface IChallenge {
    token: string;
    challenge: string;
    type: string;
}

export interface IEvent {
    type: string;
    user: string;
}

export interface IEventBody {
    token?: string;
    challenge?: string;
    type?: string;
    event?: IEvent;
}
export interface IUserSlack {
    id: string;
    name: string;
}
export interface IViewState {
    values: {
        datepicker: {
            startDate: {
                selectedDate: string;
            };
            endDate: {
                selectedDate: string;
            };
        };
        timepicker: {
            picker1: {
                selectedTime: string;
            };
            picker2: {
                selectedTime: string;
            };
        };
        reason: {
            inputReason: {
                value: string;
            };
        };
        channel: unknown;
        options: unknown;
    };
}
export interface IViewBlockLabel {
    type: string;
    text: string;
}
export interface IViewBlockElement {
    type: string;
    multiline: boolean;
    actionId: string;
}
export interface IViewBlock {
    type: string;
    blockId: string;
    label: IViewBlockLabel;
    element: IViewBlockElement;
}
export interface IView {
    state: IViewState;
    callbackId: string;
    blocks: IViewBlock[];
}
export interface IAction {
    actionId: string;
    blockId: string;
    text: {
        type: string;
        text: string;
        emoji: boolean;
    };
    value: string;
    type: string;
    actionTs: string;
}
export interface IContainer {
    type: string;
    messageTs: string;
    attachmentId: number;
    channelId: string;
    isEphemeral: boolean;
    isAppUnfurl: boolean;
}
export interface IInteractive {
    type: string;
    user: IUserSlack;
    callbackId: string;
    triggerId: string;
    view: IView;
    container: IContainer;
    actions: IAction[];
}

export interface IInteractiveBody {
    payload: string;
}
