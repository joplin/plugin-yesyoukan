import Logger from "@joplin/utils/Logger";
import { CardToRender, IpcMessage, IpcMessageType, Note, RenderedCard, RenderResult, settingItems } from "./utils/types";
import joplin from "api";
import { boardsEqual, parseAsNoteLink, parseNote } from "./utils/noteParser";
import { msleep } from "./utils/time";
import processRenderedCards from "./utils/processRenderedCards";
import { toggleCheckbox } from "./utils/renderMarkupUtils";
import { ViewHandle } from "api/types";

const logger = Logger.create('YesYouCan: messageHandler');

type MessageHandler = (message:IpcMessage) => Promise<any>;
type LoadSelectedNoteCallback = ()=> Promise<Note>;

const setNoteHandler = async (editorHandle: ViewHandle, selectedNote: Note, messageNote:Note) => {
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
		await joplin.views.editors.saveNote(editorHandle, {
			noteId: messageNote.id,
			body: messageNote.body,
		});
	}
}

const messageHandlers = (editorHandle: string, getSelectedNote: LoadSelectedNoteCallback): Record<IpcMessageType, MessageHandler> => ({

	'isReady': null,

	'cardMessage': null,
	
	'getNote': async (_message:IpcMessage) => {
		const response = await getSelectedNote();
		logger.info('PostMessagePlugin (Webview): Responding with:', response);
		return { id: response.id, body: response.body };
	},

	'getNotes': async (message:IpcMessage) => {
		const noteIds = message.value as string[];
		const notes:Note[] = [];
		for (const noteId of noteIds) {
			notes.push(await joplin.data.get(['notes', noteId]));
		}
		return notes;
	},
	
	'shouldUseDarkColors': async () => {
		return joplin.shouldUseDarkColors();
	},

	'renderBodies': async (message:IpcMessage) => {
		const cardsToRender = JSON.parse(message.value) as Record<string, CardToRender>;

		return processRenderedCards(
			cardsToRender,
			noteId => joplin.data.get(['notes', noteId], { fields: ['title', 'body', 'todo_due', 'todo_completed', 'is_todo'] }),
			(markup, option) => joplin.commands.execute('renderMarkup', 1, markup, null, option),
		);
	},

	'getTags': async (message:IpcMessage) => {
		const noteIds = message.value as string[];
		const notesIdsToTags:Record<string, any>[] = []

		for (const noteId of noteIds) {
			const result = await joplin.data.get(['notes', noteId, 'tags']);
			notesIdsToTags[noteId] = result.items;
		}

		return notesIdsToTags;
	},

	'setNote': async (message:IpcMessage) => {
		await setNoteHandler(editorHandle, await getSelectedNote(), message.value as Note);
	},

	'setNoteCheckbox': async (message:IpcMessage) => {
		const { cardMessage, noteId } = message.value;
		const note:Note = await joplin.data.get(['notes', noteId], { fields: ['body'] });
		const newBody = toggleCheckbox(cardMessage, note.body);
		console.info('BEFORE', note.body);
		console.info('AFTER', newBody);
		await joplin.data.put(['notes', noteId], null, { body: newBody });
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

	'getAppSettings': async () => {
		return {
			'dateFormat': await joplin.settings.globalValue('dateFormat'),
			'timeFormat': await joplin.settings.globalValue('timeFormat'),
		};
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
		const selectedNote = await getSelectedNote();

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
});

export default messageHandlers;