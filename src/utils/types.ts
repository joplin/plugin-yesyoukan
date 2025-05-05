import { SettingItem, SettingItemType } from "../../api/types";

export interface Note {
	id: string;
	title: string;
	body: string;
	todo_due: number;
	todo_completed: number;
	is_todo: number;
	deleted_time: number;
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
	noteExists?: boolean;
	todo_due: number;
	todo_completed: number;
	is_todo: number;
	deleted_time?: number;
}

export interface Filters {
	tagIds: string[];
}

export const getDefaultFilters = ():Filters => {
	return {
		tagIds: [],
	}
}

export interface AppSettings {
	dateFormat: string;
	timeFormat: string;
}

export const getDefaultAppSettings = ():AppSettings => {
	return {
		dateFormat: 'DD/MM/YYYY',
		timeFormat: 'HH:mm',
	}
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
	settings: BoardSettings;
}

export interface State {
	board: Board;
}

export type IpcMessageType =
	'getNote' | // This returns the note associated with the board
	'getNotes' | // This returns any number of notes
	'duplicateNote' |
	'setNote' |
	'isReady' |
	'getSettings' |
	'getAppSettings' |
	'renderBodies' |
	'openItem' |
	'cardMessage' |
	'scrollToCard' |
	'createNote' |
	'openNote' |
	'deleteNote' |
	'getTags' |
	'setNoteCheckbox' |
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
	menuPopupFromTemplate(template:any[]);
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
export enum CardDoubleClickAction {
	openInBoard = 'openInBoard',
	openInNote = 'openInNote',
}

// boardId: cardId: Date in ms
export type LastStackAddedDates = Record<string, Record<string, number>>;

export interface PluginSettings {
	stackWidth?: number;
	confirmKey?: ConfirmKey;
	newlineKey?: NewlineKey;
	stackDynamicWidth?: boolean;
	cardDoubleClickAction?: CardDoubleClickAction;
	autoArchiveDelayDays?: number;
	lastStackAddedDates?: LastStackAddedDates;
	archiveNoteId?: string;
}

export interface CardSettings {
	backgroundColor?: string;
}

export interface StackSettings {
	backgroundColor?: string;
}

export interface BoardSettings extends PluginSettings {
	filters?: Filters;
}

export type PluginSettingItems = Record<keyof PluginSettings, SettingItem>;
export type BoardSettingItems = Record<keyof BoardSettings, SettingItem>;
export type CardSettingItems = Record<keyof CardSettings, SettingItem>;
export type StackSettingItems = Record<keyof StackSettings, SettingItem>;

export type SettingItems = PluginSettingItems | CardSettingItems | StackSettingItems | BoardSettingItems;

export const pluginSettingItems:PluginSettingItems = {
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

	cardDoubleClickAction: {
		label: 'Card double-click action',
		type: SettingItemType.String,
		isEnum: true,
		public: true,
		value: CardDoubleClickAction.openInBoard,
		options: {
			[CardDoubleClickAction.openInBoard]: 'Open in board',
			[CardDoubleClickAction.openInNote]: 'Open in note',
		},
		section: settingSectionName,
	},

	autoArchiveDelayDays: {
		label: 'Auto-archive cards in the right-most stack after (days)',
		description: 'Archived cards are moved to an archive board that is automatically created. Set the delay to 0 to disable the feature.',
		type: SettingItemType.Int,
		public: true,
		value: 0,
		section: settingSectionName,
	},

	lastStackAddedDates: {
		label: '',
		type: SettingItemType.Object,
		public: false,
		value: 0,
		section: settingSectionName,
	},

	archiveNoteId: {
		label: '',
		type: SettingItemType.String,
		public: false,
		value: '',
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

export const boardSettingItems:BoardSettingItems = {
	filters: {
		label: 'Filters',
		type: SettingItemType.Object,
		public: false,
		value: '',
	},

	...pluginSettingItems,
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

export interface RenderedCard {
	title: RenderResult;
	body: RenderResult;
	noteExists: boolean;
	todo_due: number;
	todo_completed: number;
	is_todo: number;
	deleted_time: number;
}