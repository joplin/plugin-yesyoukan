import joplin from 'api';
import { Board, LastStackAddedDates, IpcMessage, Note, pluginSettingItems, settingSectionName } from './utils/types';
import { boardsEqual, noteIsBoard, parseNote, serializeBoard } from './utils/noteParser';
import Logger, { TargetType } from '@joplin/utils/Logger';
import { MenuItemLocation } from 'api/types';
import { msleep } from './utils/time';
import messageHandlers from './messageHandlers';
import { processAutoArchiving, recordLastStackAddedDates } from './utils/autoArchive';
import uuid from './utils/uuid';

const globalLogger = new Logger();
globalLogger.addTarget(TargetType.Console);
Logger.initializeGlobalLogger(globalLogger);

const logger = Logger.create('YesYouCan: Index');

const newNoteBody = `# Backlog

# In progress

# Done

\`\`\`kanban-settings
# Do not remove this block
\`\`\``;

const getArchiveNote = async(noteId:string):Promise<Note|null> => {
	const s = await joplin.settings.value('archiveNoteIds');
	if (!s) return null;

	const archiveNoteIds = JSON.parse(s);
	const archiveNoteId = archiveNoteIds[noteId];

	if (!archiveNoteId) return null;

	const note = await joplin.data.get(['notes', archiveNoteId], { fields: ['id', 'title', 'body', 'deleted_time', 'parent_id'] });
	return note && !note.deleted_time ? note : null;
}

const handleAutoArchiving = async () => {
	const settings = (await joplin.settings.values(['lastStackAddedDates', 'autoArchiveDelayDays']));
	let lastStackAddedDates = settings.lastStackAddedDates as LastStackAddedDates;
	const autoArchiveDelayDays = settings.autoArchiveDelayDays as number;

	if (!autoArchiveDelayDays) return;

	const selectedNote:Note = await joplin.workspace.selectedNote();

	logger.info('Selected note:', selectedNote);

	const board = await parseNote(selectedNote.id, selectedNote.body);

	const archiveNote = await getArchiveNote(selectedNote.id);
	let archiveBoard:Board;
	
	if (archiveNote) {
		logger.info('Archive note exists:', archiveNote);
		archiveBoard = await parseNote(archiveNote.id, archiveNote.body);
	} else {
		logger.info('Archive note does not already exist');
		archiveBoard = {
			noteId: '',
			settings: {},
			stacks: [
				{
					id: uuid(),
					cards: [],
					title: 'Archive',
				},
			],
		}
	}
	
	const newDates = await recordLastStackAddedDates(board, lastStackAddedDates);

	if (newDates !== lastStackAddedDates) {
		await joplin.settings.setValue('lastStackAddedDates', newDates);
		lastStackAddedDates = newDates;
	}

	const result = await processAutoArchiving(
		board,
		archiveBoard,
		lastStackAddedDates,
		autoArchiveDelayDays,
	);

	if (result.board === board) return;

	logger.info('Some cards need to be archived - updating board and archive note bodies');

	const noteBody = serializeBoard(result.board);
	const archiveNoteBody = serializeBoard(result.archive);

	if (archiveNote) {
		logger.info('Updating archive note:', archiveNote);
		await joplin.data.put(['notes', archiveNote.id], null, { body: archiveNoteBody });
	} else {
		const s = await joplin.settings.value('archiveNoteIds');
		const archiveNoteIds = s ? JSON.parse(s) : {};
		const newNote = await joplin.data.post(['notes'], null, {
			title: selectedNote.title + ' - Archive',
			body: archiveNoteBody,
			parent_id: selectedNote.parent_id,
		});
		logger.info('Created new archive note:', newNote);
		archiveNoteIds[selectedNote.id] = newNote.id;
		await joplin.settings.setValue('archiveNoteIds', JSON.stringify(archiveNoteIds));
	}

	await joplin.data.put(['notes', board.noteId], null, { body: noteBody });
}

joplin.plugins.register({
	onStart: async function() {
		const versionInfo = await joplin.versionInfo();

		await joplin.settings.registerSection(settingSectionName, {
			label: 'YesYouKan',
			iconName: 'fas fa-th-list',
		});
		await joplin.settings.registerSettings(pluginSettingItems);

		const editors = joplin.views.editors;

		const view = await editors.create("kanbanBoard");
		
		await editors.setHtml(view, `<div id="root" class="platform-${versionInfo.platform}"></div>`);
		await editors.addScript(view, './panel.js');
		await editors.addScript(view, './style/reset.css');
		await editors.addScript(view, './style/main.css');
		await editors.addScript(view, './vendor/coloris/coloris.css');
		await editors.addScript(view, './vendor/coloris/coloris.js');

		let previousNoteId = '';

		const updateFromSelectedNote = async () => {
			const note:Note = await joplin.workspace.selectedNote();
			if (!note) return;

			if (note.id === previousNoteId) {
				// Currently we only update the board from the note when the user has switched to a
				// different note. We don't update if, for example, the note is changed via external
				// editor, sync or data API. This is a bit of an edge case anyway and supporting
				// this means bi-directional updates which turn out to be very complicated and just
				// not working. The main issue is with the board being updated asynchronoulsy when
				// it contains "notes as cards", so we have this:
				//
				// - New card is added to the board
				// - Underlying note is updated
				// - Which triggers a board update
				// - We then compare the current board and the board generated from the note.
				//   Normally they should be identical, so the update should be skipped. But because
				//   "cards as notes" contain additional metadata, which is fetch asynchronously,
				//   it's going to be different.
				// - So we update the board from the note, which triggers a full refresh and, for
				//   example, clear scroll position or any open editor.
				//
				// Getting all this to work properly would be complex, will require ongoing
				// maintenance and will be difficult to detect since it touches app integration and
				// there won't be automated tests. So overall it doesn't seem worth it.
				logger.warn('Skipping update: Note has not changed');
				return;
			}

			logger.info('updateFromSelectedNote: posting "setNote"');
			previousNoteId = note.id;
			editors.postMessage(view, { type: 'updateBoardFromNote', value: { id: note.id, body: note.body }});
		}

		await editors.onActivationCheck(view, async () => {
			const note = await joplin.workspace.selectedNote();
			if (!note) return false;

			logger.info('onActivationCheck: Handling note: ' + note.id);
			const isBoard = noteIsBoard(note ? note.body : '');
			logger.info('onActivationCheck: Note is board:', isBoard);
			return isBoard;
		});

		await editors.onUpdate(view, async () => {
			logger.info('onUpdate');
			await updateFromSelectedNote();
		});

		await joplin.commands.register({
			name: 'createKanbanBoard',
			label: 'Create Kanban board',
			execute: async () => {
				logger.info('Creating new Kanban note...');
				await joplin.commands.execute('newNote', newNoteBody);

				// Wait for the note to be created and the UI to be updated before showing the
				// editor
				setTimeout(async () => {
					await joplin.commands.execute('showEditorPlugin');
					await updateFromSelectedNote();
				}, 200);				
			},
		});

		await joplin.views.menuItems.create('createKanbanBoardMenuItem', 'createKanbanBoard', MenuItemLocation.Tools, { accelerator: 'CmdOrCtrl+Alt+Shift+K' });

		editors.onMessage(view, async (message:IpcMessage) => {
			// These messages are internal messages sent within the app webview and can be ignored
			if ((message as any).kind === 'ReturnValueResponse') return;

			logger.info('PostMessagePlugin (Webview): Got message from webview:', message);

			if (message.type === 'isReady') {
				await handleAutoArchiving();
				await updateFromSelectedNote();
				return;
			}
			
			const messageHandler = messageHandlers[message.type];
			if (messageHandler) return messageHandler(message);

			logger.warn('Unknown message: ' + JSON.stringify(message));
		});
	},
});