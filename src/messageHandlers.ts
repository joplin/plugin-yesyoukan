import Logger from "@joplin/utils/Logger";
import { CardToRender, IpcMessage, IpcMessageType, Note, settingItems } from "./utils/types";
import joplin from "api";
import { boardsEqual, parseNote } from "./utils/noteParser";
import { msleep } from "./utils/time";

const logger = Logger.create('YesYouCan: messageHandler');

type MessageHandler = (message:IpcMessage) => Promise<any>;

const setNoteHandler = async (messageNote:Note) => {
	const selectedNote = await joplin.workspace.selectedNote();
	const newBoard = await parseNote(messageNote.id, messageNote.body);
	const currentBoard = await parseNote(selectedNote.id, selectedNote.body);

	if (messageNote.id !== selectedNote.id) {
		logger.info('NOT updating note - current note has changed while the board was being updated');
		return;
	}

	if (boardsEqual(newBoard, currentBoard)) {
		logger.info('NOT updating note - board has not changed');
	} else {
		logger.info('Updating note - board has changed');
		await joplin.data.put(['notes', messageNote.id], null, { body: messageNote.body });
	}
}

const messageHandlers:Record<IpcMessageType, MessageHandler> = {

	'isReady': null,

	'cardMessage': null,
	
	'getNote': async (_message:IpcMessage) => {
		const response = await joplin.workspace.selectedNote();
		logger.info('PostMessagePlugin (Webview): Responding with:', response);
		return { id: response.id, body: response.body };
	},

	'renderBodies': async (message:IpcMessage) => {
		const toRender = JSON.parse(message.value) as Record<string, CardToRender>;
		const rendered:Record<string, string> = {};
		for (const [id, cardToRender] of Object.entries(toRender)) {
			let bodyToRender = '';

			if (cardToRender.source === "note") {
				// TODO: also update note title, if it has changed
				const note = await joplin.data.get(['notes', cardToRender.noteId], { fields: ['body'] });
				bodyToRender = note.body;
			} else { // source = card
				bodyToRender = cardToRender.cardBody;
			}

			const result = await joplin.commands.execute('renderMarkup', 1, bodyToRender, null, { postMessageSyntax: 'cardPostMessage("' + id  + '")'});
			rendered[id] = result;
		}

		return rendered;
	},

	'setNote': async (message:IpcMessage) => {
		await setNoteHandler(message.value as Note);
	},

	'openItem': async (message:IpcMessage) => {
		await joplin.commands.execute('openItem', message.value);
	},

	'openNote': async (message:IpcMessage) => {
		await joplin.commands.execute('openNote', message.value);
	},

	'getSettings': async (_message:IpcMessage) => {
		return await (joplin.settings as any).values(Object.keys(settingItems));
	},

	'scrollToCard': async (message:IpcMessage) => {
		await joplin.commands.execute('showEditorPlugin', null, false);
		await msleep(500);
		// `editor.scrollToText` would need to be changed to support scrolling to a header, when
		// there are multiple headers with the same title
		if (message.value.cardIndex > 0) logger.warn('Not implemented: There is more than one card with the same title - will scroll to the first card with that title');
		await joplin.commands.execute('editor.scrollToText', { text: message.value.cardTitle , element: 'h2' });
	},

	'createNote': async (message:IpcMessage) => {
		const selectedNote = await joplin.workspace.selectedNote();

		const newNote = await joplin.data.post(['notes'], null, {
			parent_id: selectedNote.parent_id,
			title: message.value.title,
			body: message.value.body,
		});

		return newNote;
	},

	'deleteNote': async (message:IpcMessage) => {
		await joplin.data.delete(['notes', message.value]);
	},
}

export default messageHandlers;