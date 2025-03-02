import { SettingItem, SettingItemType } from "../../api/types";

export interface Note {
	id: string;
	title: string;
	body: string;
}

export interface Tag {
	id: string;
	title: string;
}

export interface Card {
	id: string;
	title: string;
	titleHtml?: string;
	body?: string;
	bodyHtml?: string;
	bodyHtmlHash?: string;
	settings?: CardSettings;
	tags?: Tag[];
}

export interface Stack {
	id: string;
	title: string;
	cards: Card[];
	settings?: StackSettings;
}

export interface Board {
	noteId: string;
	stacks: Stack[];
	settings: Settings;
}

export interface State {
	board: Board;
}

export type IpcMessageType =
	'getNote' |
	'setNote' |
	'isReady' |
	'getSettings' |
	'renderBodies' |
	'openItem' |
	'cardMessage' |
	'scrollToCard' |
	'createNote' |
	'openNote' |
	'deleteNote' |
	'getTags' |
	'shouldUseDarkColors';

export interface IpcMessage {
	type: IpcMessageType;
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

export const settingSectionName = 'yesYouKan';

export type ValidationKey = 'Enter' | 'Shift+Enter' | 'Ctrl+Enter' | 'Cmd+Enter';
export type ConfirmKey = ValidationKey;
export type NewlineKey = ValidationKey;

export interface Settings {
	stackWidth?: number;
	confirmKey?: ConfirmKey;
	newlineKey?: NewlineKey;
	stackDynamicWidth?: boolean;
}

export interface CardSettings {
	backgroundColor?: string;
}

export interface StackSettings {
	backgroundColor?: string;
}

export type AppSettingItems = Record<keyof Settings, SettingItem>;
export type CardSettingItems = Record<keyof CardSettings, SettingItem>;
export type StackSettingItems = Record<keyof StackSettings, SettingItem>;
export type SettingItems = AppSettingItems | CardSettingItems | StackSettingItems;

export const settingItems:AppSettingItems = {
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

	stackDynamicWidth: {
		label: 'Enable stack dynamic width',
		description: 'When this is enabled, the width of the stacks is changed dynamically to fit the whole window',
		type: SettingItemType.Bool,
		value: false,
		public: true,
		section: settingSectionName,
	},
};

export const cardSettingItems:CardSettingItems = {
	'backgroundColor': {
		label: 'Background colour',
		type: SettingItemType.String,
		public: true,
		value: '',
		section: settingSectionName,
	},
}

export const stackSettingItems:StackSettingItems = {
	'backgroundColor': {
		label: 'Background colour',
		type: SettingItemType.String,
		public: true,
		value: '',
		section: settingSectionName,
	},
}

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

export type Platform = 'desktop' | 'mobile'; 

export interface CardToRender {
	source: 'note' | 'card',
	noteId: string;
	cardTitle: string;
	cardBody: string;
}

export interface RenderedNote {
	title: RenderResult;
	body: RenderResult;
}