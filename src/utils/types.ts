import { SettingItem, SettingItemType } from "../../api/types";

export interface Note {
	id: string;
	body: string;
}

export interface Card {
	id: string;
	title: string;
	body?: string;
	bodyHtml?: string;
	bodyHtmlHash?: string;
}

export interface Stack {
	id: string;
	title: string;
	cards: Card[];
}

export interface Board {
	noteId: string;
	stacks: Stack[];
	settings: Settings;
}

export interface State {
	board: Board;
}

export interface IpcMessage {
	type: 'getNote' | 'setNote' | 'isReady' | 'getSettings' | 'renderBodies';
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
		noteId: '',
		settings: {},
		stacks: [],
	}
}

export type SettingItems = Record<string, SettingItem> ;

export const settingSectionName = 'yesYouKan';

export type ValidationKey = 'Enter' | 'Shift+Enter' | 'Ctrl+Enter' | 'Cmd+Enter';
export type ConfirmKey = ValidationKey;
export type NewlineKey = ValidationKey;

export interface Settings {
	stackWidth?: number;
	confirmKey?: ConfirmKey;
	newlineKey?: NewlineKey;
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
		description: 'Press this key to confirm the text you just entered in the card title or body.',
		type: SettingItemType.String,
		isEnum: true,
		public: true,
		value: 'Enter',
		options: {
			'Enter': 'Enter',
			'Shift+Enter': 'Shift+Enter',
			'Ctrl+Enter': 'Ctrl+Enter',
			'Cmd+Enter': 'Cmd+Enter',
		},
		section: settingSectionName,
	},
	newlineKey: {
		label: 'Newline key',
		description: 'Press this key to enter a newline in the card body.',
		type: SettingItemType.String,
		isEnum: true,
		public: true,
		value: 'Shift+Enter',
		options: {
			'Enter': 'Enter',
			'Shift+Enter': 'Shift+Enter',
			'Ctrl+Enter': 'Ctrl+Enter',
			'Cmd+Enter': 'Cmd+Enter',
		},
		section: settingSectionName,
	},
};

export interface RenderResultPluginAsset {
	source: string;
	name: string;
	mime: string;
	path: string;

	// For built-in Mardown-it plugins, the asset path is relative (and can be
	// found inside the @joplin/renderer package), while for external plugins
	// (content scripts), the path is absolute. We use this property to tell if
	// it's relative or absolute, as that will inform how it's loaded in various
	// places.
	pathIsAbsolute: boolean;
}

export interface RenderResult {
	html: string;
	pluginAssets: RenderResultPluginAsset[];
	cssStrings: string[];
}