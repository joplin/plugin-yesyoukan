import joplin from 'api';
import { IpcMessage, Note, settingItems, settingSectionName } from './utils/types';
import AsyncActionQueue from './utils/AsyncActionQueue';
import { boardsEqual, noteIsBoard, parseNote } from './utils/noteParser';
import Logger, { TargetType } from '@joplin/utils/Logger';
import { MenuItemLocation, SettingItem, SettingItemType } from 'api/types';
import JoplinViewsPanels from 'api/JoplinViewsPanels';

const globalLogger = new Logger();
globalLogger.addTarget(TargetType.Console);
Logger.initializeGlobalLogger(globalLogger);

const logger = Logger.create('YesYouCan: Index');

const noteUpdateQueue = new AsyncActionQueue(100);

const newNoteBody = `# Backlog

# In progress

# Done

\`\`\`kanban-settings
# Do not remove this block
\`\`\``;

joplin.plugins.register({
	onStart: async function() {
		await joplin.settings.registerSection(settingSectionName, {
			label: 'YesYouKan',
			iconName: 'fas fa-th-list',
		});
		await joplin.settings.registerSettings(settingItems);

		const panels = (joplin.views as any).editors as any;

		const view = await panels.create("kanbanBoard");
		
		await panels.setHtml(view, '<div id="root"></div>');
		await panels.addScript(view, './panel.js');
		await panels.addScript(view, './style/reset.css');
		await panels.addScript(view, './style/main.css');

		let panelEnabled = true;
		let panelReady = false;

		const makeNoteUpdateAction = () => {
			return async () => {
				const note = await joplin.workspace.selectedNote();

				logger.info('makeNoteUpdateAction: Handling note: ' + note.id);

				if (!noteIsBoard(note ? note.body : '')) {
					logger.info('Note is not a Kanban board - disactivating editor...');
					await panels.setActive(view, false);
					panelEnabled = false;
					return;
				}

				logger.info('makeNoteUpdateAction: Note is a Kanban board - notifying panel and activating editor...');

				panelEnabled = true;
				await panels.setActive(view, true);

				if (panelReady) {
					await panels.postMessage(view, { type: 'setNote', value: { id: note.id, body: note.body }});
				} else {
					logger.info('makeNoteUpdateAction: Editor is not ready - will retry...');
					noteUpdateQueue.push(makeNoteUpdateAction());
				}
			};
		};

		await joplin.commands.register({
			name: 'createKanbanBoard',
			label: 'Create Kanban board',
			execute: async () => {
				logger.info('Creating new Kanban note...');
				await joplin.commands.execute('newNote', newNoteBody);
				noteUpdateQueue.push(makeNoteUpdateAction());
			},
		});

		await joplin.views.menuItems.create('createKanbanBoardMenuItem', 'createKanbanBoard', MenuItemLocation.Tools, { accelerator: 'CmdOrCtrl+Alt+Shift+K' });

		panels.onMessage(view, async (message:IpcMessage) => {
			logger.info('PostMessagePlugin (Webview): Got message from webview:', message);

			if (!panelEnabled) {
				logger.info('Skipping message - panel is disabled');
				return;
			}

			if (message.type === 'isReady') {
				panelReady = true;
				return;
			}

			if (message.type === 'getNote') {
				const response = await joplin.workspace.selectedNote();
				logger.info('PostMessagePlugin (Webview): Responding with:', response);
				return { id: response.id, body: response.body };
			}

			if (message.type === 'renderBodies') {
				const toRender = JSON.parse(message.value);
				const rendered:Record<string, string> = {};
				for (const [id, body] of Object.entries(toRender)) {
					const result = await joplin.commands.execute('renderMarkup', 1, body);
					rendered[id] = result;
				}

				return rendered;
			}

			if (message.type === 'setNote') {
				const selectedNote = await joplin.workspace.selectedNote();
				const messageNote = message.value as Note;
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
					await joplin.commands.execute('editor.setText', messageNote.body);
					await joplin.data.put(['notes', messageNote.id], null, { body: messageNote.body });
				}
				return;
			}

			if (message.type === 'getSettings') {
				return await (joplin.settings as any).values(Object.keys(settingItems));
			}

			throw new Error('Unknown message: ' + JSON.stringify(message));
		});

		joplin.workspace.onNoteSelectionChange(async () => {
			noteUpdateQueue.push(makeNoteUpdateAction());
		});
	},
});