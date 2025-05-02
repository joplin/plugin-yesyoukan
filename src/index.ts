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

const getArchiveNote = async():Promise<Note|null> => {
	const archiveNoteId:string = await joplin.settings.value('archiveNoteId');
	if (!archiveNoteId) return null;

	const note = await joplin.data.get(['notes', archiveNoteId], { fields: ['id', 'body', 'deleted_time'] });
	return note && !note.deleted_time ? note : null;
}

const handleAutoArchiving = async () => {
	const settings = (await joplin.settings.values(['lastStackAddedDates', 'autoArchiveDelayDays']));
	let lastStackAddedDates = settings.lastStackAddedDates as LastStackAddedDates;
	const autoArchiveDelayDays = settings.autoArchiveDelayDays as number;

	if (!autoArchiveDelayDays) return;

	const note:Note = await joplin.workspace.selectedNote();
	const board = await parseNote(note.id, note.body);

	const archiveNote = await getArchiveNote();
	let archiveBoard:Board;
	
	if (archiveNote) {
		archiveBoard = await parseNote(archiveNote.id, archiveNote.body);
	} else {
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
	
	const newDates = recordLastStackAddedDates(board, lastStackAddedDates);

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
		await joplin.data.put(['notes', archiveNote.id], null, { body: archiveNoteBody });
	} else {
		const newNote = await joplin.data.post(['notes'], null, { title: note.title + ' - Archive', body: archiveNoteBody });
		await joplin.settings.setValue('archiveNoteId', newNote.id);
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

		const updateFromSelectedNote = async () => {
			const note:Note = await joplin.workspace.selectedNote();
			if (!note) return;

			editors.postMessage(view, { type: 'setNote', value: { id: note.id, body: note.body }});
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
			console.info('updateFromSelectedNote - ON UPDATE');
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
				console.info('updateFromSelectedNote - IS READY');
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