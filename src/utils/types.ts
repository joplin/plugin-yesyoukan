import { SettingItem, SettingItemType } from "api/types";

export interface Card {
	id: string;
	title: string;
	body: string;
}

export interface Stack {
	id: string;
	title: string;
	cards: Card[];
}

export interface Board {
	stacks: Stack[];
	settings: Settings;
}

export interface State {
	board: Board;
}

export interface IpcMessage {
	type: 'getNoteBody' | 'setNoteBody' | 'isReady' | 'getSettings';
	value?: any;
}

export interface OnMessageMessage {
	message: IpcMessage;
}

type WebviewApiOnMessageHandler = (message:OnMessageMessage) => void;

export interface WebviewApi {
	postMessage<T>(message:IpcMessage): Promise<T>;
	onMessage(handler:WebviewApiOnMessageHandler);
}

export const emptyBoard = ():Board => {
	return {
		settings: {},
		stacks: [],
	}
}

export type SettingItems = Record<string, SettingItem> ;

export const settingSectionName = 'yesYouKan';

export type ConfirmKey = 'Enter' | 'Shift+Enter';

export interface Settings {
	stackWidth?: number;
	confirmKey?: ConfirmKey;
}

export const settingItems:SettingItems = {
	stackWidth: {
		label: 'Stack width',
		type: SettingItemType.Int,
		public: true,
		value: 270,
		section: settingSectionName,
	},
	confirmKey: {
		label: 'Confirm key',
		description: 'Press this key to confirm the text you just entered. The other option will be used to enter a newline in the card body.',
		type: SettingItemType.String,
		isEnum: true,
		public: true,
		value: 'Enter',
		options: {
			'Enter': 'Enter',
			'Shift+Enter': 'Shift+Enter',
		},
		section: settingSectionName,
	},
};