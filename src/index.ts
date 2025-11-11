import joplin from 'api';
import { Board, LastStackAddedDates, IpcMessage, Note, pluginSettingItems, settingSectionName } from './utils/types';
import { noteIsBoard, parseNote, serializeBoard } from './utils/noteParser';
import Logger, { TargetType } from '@joplin/utils/Logger';
import { MenuItemLocation, ViewHandle } from 'api/types';
import messageHandlers from './messageHandlers';
import { processAutoArchiving, recordLastStackAddedDates } from './utils/autoArchive';
import noteFields from './utils/noteFields';
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

const registerEditorPlugin = async () => {
	const versionInfo = await joplin.versionInfo();

	const editors = joplin.views.editors;

	await editors.register('kanbanBoard', {
		async onSetup(view) {
			await editors.setHtml(view, `<div id="root" class="platform-${versionInfo.platform}"></div>`);
			await editors.addScript(view, './panel.js');
			await editors.addScript(view, './style/reset.css');
			await editors.addScript(view, './style/main.css');
			await editors.addScript(view, './vendor/coloris/coloris.css');
			await editors.addScript(view, './vendor/coloris/coloris.js');

			const selectedNoteIdRef = { current: '' };
			const loadSelectedNote = async () => {
				if (!selectedNoteIdRef.current) return null;
				const result = joplin.data.get(['notes', selectedNoteIdRef.current], { fields: noteFields });
				return result;
			};

			const updateFromSelectedNote = async () => {
				const note:Note = await joplin.workspace.selectedNote();
				if (!note) return;

				logger.info('updateFromSelectedNote: posting "updateNoteFromBoard"');
				editors.postMessage(view, { type: 'updateBoardFromNote', value: { id: note.id, body: note.body }});
			};

			await editors.onUpdate(view, async (event) => {
				logger.info('onUpdate');
				if (event.noteId) {
					selectedNoteIdRef.current = event.noteId;
					await editors.postMessage(
						view,
						{ type: 'updateBoardFromNote', value: { id: event.noteId, body: event.newBody } },
					);
				}
			});

			const handlers = messageHandlers(view, loadSelectedNote, selectedNoteIdRef);
			await editors.onMessage(view, async (message:IpcMessage) => {
				// These messages are internal messages sent within the app webview and can be ignored
				if ((message as any).kind === 'ReturnValueResponse') return;

				logger.info('PostMessagePlugin (Webview): Got message from webview:', message);

				if (message.type === 'isReady') {
					const modifiedNote = await handleAutoArchiving();
					if (modifiedNote) {
						await joplin.data.put(['notes', modifiedNote.id], null, { body: modifiedNote.body });
						await updateFromSelectedNote();
					}
					return;
				}

				const messageHandler = handlers[message.type];
				if (messageHandler) return messageHandler(message);

				logger.warn('Unknown message: ' + JSON.stringify(message));
			});
		},
		async onActivationCheck(event) {
			if (!event.noteId) return false;

			const note = await joplin.data.get([ 'notes', event.noteId ], { fields: ['body'] });
			logger.info('onActivationCheck: Handling note: ' + event.noteId);
			const isBoard = noteIsBoard(note?.body ?? '');
			logger.info('onActivationCheck: Note is board:', isBoard);
			return isBoard;
		},
	});
};

const getArchiveNoteIds = async() => {
	const s = await joplin.settings.value('archiveNoteIds');
	if (!s) return [];

	const archiveNoteIds = JSON.parse(s) as Record<string, string>;
	return archiveNoteIds;
};

const getArchiveNote = async(noteId:string):Promise<Note|null> => {
	const archiveNoteIds = await getArchiveNoteIds();
	const archiveNoteId = archiveNoteIds[noteId];

	if (!archiveNoteId) return null;

	const note = await joplin.data.get(['notes', archiveNoteId], { fields: ['id', 'title', 'body', 'deleted_time', 'parent_id'] });
	return note && !note.deleted_time ? note : null;
}

const handleAutoArchiving = async () => {
	const settings = (await joplin.settings.values(['lastStackAddedDates', 'autoArchiveDelayDays']));
	let lastStackAddedDates = settings.lastStackAddedDates as LastStackAddedDates;
	const autoArchiveDelayDays = settings.autoArchiveDelayDays as number;

	if (!autoArchiveDelayDays) return null;

	const selectedNote:Note = await joplin.workspace.selectedNote();

	logger.info('handleAutoArchiving: Selected note:', selectedNote);

	const existingArchiveIds = Object.values((await getArchiveNoteIds())) as string[];
	if (existingArchiveIds.includes(selectedNote.id)) {
		logger.info('handleAutoArchiving: Note is an archive - not running auto-archiving');
		return null;
	}

	const board = await parseNote(selectedNote.id, selectedNote.body);

	const archiveNote = await getArchiveNote(selectedNote.id);
	let archiveBoard:Board;
	
	if (archiveNote) {
		logger.info('handleAutoArchiving: Archive note exists:', archiveNote);
		archiveBoard = await parseNote(archiveNote.id, archiveNote.body);
	} else {
		logger.info('handleAutoArchiving: Archive note does not already exist');
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

	// Keep this to display the list of hashes:

	// const logInfo:Record<string, string> = {};
	// for (const [noteId, cardHashes] of Object.entries(lastStackAddedDates)) {
	// 	for (const [cardHash, timestamp] of Object.entries(cardHashes)) {
	// 		logInfo[noteId + '_' + cardHash] = dayjs(timestamp).format();
	// 	}
	// }

	// logger.info('lastStackAddedDates:');
	// logger.info(logInfo);

	const result = await processAutoArchiving(
		board,
		archiveBoard,
		lastStackAddedDates,
		autoArchiveDelayDays,
	);

	if (result.board === board) return null;

	logger.info('handleAutoArchiving: Some cards need to be archived - updating board and archive note bodies');

	const noteBody = serializeBoard(result.board);
	const archiveNoteBody = serializeBoard(result.archive);

	if (archiveNote) {
		logger.info('handleAutoArchiving: Updating archive note:', archiveNote);
		await joplin.data.put(['notes', archiveNote.id], null, { body: archiveNoteBody });
	} else {
		const s = await joplin.settings.value('archiveNoteIds');
		const archiveNoteIds = s ? JSON.parse(s) : {};
		const newNote = await joplin.data.post(['notes'], null, {
			title: selectedNote.title + ' - Archive',
			body: archiveNoteBody,
			parent_id: selectedNote.parent_id,
		});
		logger.info('handleAutoArchiving: Created new archive note:', newNote);
		archiveNoteIds[selectedNote.id] = newNote.id;
		await joplin.settings.setValue('archiveNoteIds', JSON.stringify(archiveNoteIds));
	}

	return { id: board.noteId, body: noteBody };
}

joplin.plugins.register({
	onStart: async function() {
		await joplin.settings.registerSection(settingSectionName, {
			label: 'YesYouKan',
			iconName: 'fas fa-th-list',
		});
		await joplin.settings.registerSettings(pluginSettingItems);

		await registerEditorPlugin();

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
				}, 200);				
			},
		});

		await joplin.views.menuItems.create('createKanbanBoardMenuItem', 'createKanbanBoard', MenuItemLocation.Tools, { accelerator: 'CmdOrCtrl+Alt+Shift+K' });
	},
});