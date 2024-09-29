import joplin from 'api';
import { IpcMessage, settingItems, settingSectionName } from './utils/types';
import AsyncActionQueue from './utils/AsyncActionQueue';
import { noteIsBoard } from './utils/noteParser';
import Logger, { TargetType } from '@joplin/utils/Logger';
import { MenuItemLocation, SettingItem, SettingItemType } from 'api/types';

const globalLogger = new Logger();
globalLogger.addTarget(TargetType.Console);
Logger.initializeGlobalLogger(globalLogger);

const logger = Logger.create('YesYouCan: Index');

const noteUpdateQueue = new AsyncActionQueue(10);

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

		const panels = joplin.views.panels;

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
				if (!noteIsBoard(note ? note.body : '')) {
					logger.info('Note is not a Kanban board - hiding panel');
					await panels.hide(view);
					panelEnabled = false;
					panelReady = false;
					return;
				}

				logger.info('Note was updated - notifying panel...');

				panelEnabled = true;
				await panels.show(view);

				if (panelReady) {
					await panels.postMessage(view, { type: 'setNoteBody', value: note.body });
				} else {
					logger.info('Panel is not ready - will retry...');
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

			if (message.type === 'getNoteBody') {
				const response = await joplin.workspace.selectedNote();
				logger.info('PostMessagePlugin (Webview): Responding with:', response);
				return response.body;
			}

			if (message.type === 'setNoteBody') {
				await joplin.commands.execute('editor.setText', message.value);
				return;
			}

			if (message.type === 'getSettings') {
				return await (joplin.settings as any).values(Object.keys(settingItems));
			}

			throw new Error('Unknown message: ' + JSON.stringify(message));
		});

		joplin.workspace.onNoteChange(async () => {
			noteUpdateQueue.push(makeNoteUpdateAction());
		});

		joplin.workspace.onNoteSelectionChange(async () => {
			noteUpdateQueue.push(makeNoteUpdateAction());
		});
	},
});