import Logger from "@joplin/utils/Logger";
import { CardToRender, IpcMessage, IpcMessageType, Note, RenderedCard, RenderResult, pluginSettingItems } from "./utils/types";
import joplin from "api";
import { boardsEqual, parseAsNoteLink, parseNote } from "./utils/noteParser";
import { msleep } from "./utils/time";
import processRenderedCards from "./utils/processRenderedCards";
import { toggleCheckbox } from "./utils/renderMarkupUtils";

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

const noteFields = ['id', 'title', 'body', 'todo_due', 'todo_completed', 'is_todo', 'deleted_time'];

const messageHandlers:Record<IpcMessageType, MessageHandler> = {

	'isReady': null,

	'cardMessage': null,
	
	'getNote': async (_message:IpcMessage) => {
		const response = await joplin.workspace.selectedNote();
		logger.info('PostMessagePlugin (Webview): Responding with:', response);
		return { id: response.id, body: response.body };
	},

	'getNotes': async (message:IpcMessage) => {
		const noteIds = message.value as string[];
		const notes:Note[] = [];
		for (const noteId of noteIds) {
			notes.push(await joplin.data.get(['notes', noteId], { fields: noteFields }));
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
			noteId => joplin.data.get(['notes', noteId], { fields: noteFields }),
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
		await setNoteHandler(message.value as Note);
	},

	'setNoteProps': async (message:IpcMessage) => {
		const { noteId, props } = message.value;
		delete props.id;
		if (!Object.keys(props).length) throw new Error('Cannot set empty props on note: ' + noteId);
		await joplin.data.put(['notes', noteId], null, props);
	},

	'setNoteCheckbox': async (message:IpcMessage) => {
		const { cardMessage, noteId } = message.value;
		const note:Note = await joplin.data.get(['notes', noteId], { fields: ['body'] });
		const newBody = toggleCheckbox(cardMessage, note.body);
		await joplin.data.put(['notes', noteId], null, { body: newBody });
	},

	'openItem': async (message:IpcMessage) => {
		await joplin.commands.execute('openItem', message.value);
	},

	'openNote': async (message:IpcMessage) => {
		await joplin.commands.execute('openNote', message.value);
	},

	'getSettings': async (_message:IpcMessage) => {
		return await (joplin.settings as any).values(Object.keys(pluginSettingItems));
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

	'duplicateNote': async (message:IpcMessage) => {
		const noteId = message.value as string;
		const note = await joplin.data.get(['notes', noteId], {
			fields: noteFields,
		});

		const tags = await joplin.data.get(['notes', noteId, 'tags']);
		const tagTitles:string[] = tags.items.map(t => t.title);

		const newNote = {
			...note,
			title: note.title + ' - Copy',
			tags: tagTitles.join(','),
		};

		return await joplin.data.post(['notes'], null, newNote);
	},
}

export default messageHandlers;