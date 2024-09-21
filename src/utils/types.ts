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