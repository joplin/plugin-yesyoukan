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
	type: 'getNoteBody' | 'setNoteBody';
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

export interface Settings {
	stackWidth?: number;
	confirmKey?: 'Enter' | 'Shift+Enter';
}

export const defaultSettings:Settings = Object.freeze({
	stackWidth: 270,
	confirmKey: "Enter",
});