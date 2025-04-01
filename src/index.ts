import joplin from 'api';
import { IpcMessage, Note, settingItems, settingSectionName } from './utils/types';
import { boardsEqual, noteIsBoard, parseNote } from './utils/noteParser';
import Logger, { TargetType } from '@joplin/utils/Logger';
import { MenuItemLocation } from 'api/types';
import messageHandlers from './messageHandlers';

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

const registerEditorPlugin = async (windowId: string|undefined) => {
	const versionInfo = await joplin.versionInfo();

	const editors = joplin.views.editors;

	const view = await editors.create("kanbanBoard", { windowId });
	
	await editors.setHtml(view, `<div id="root" class="platform-${versionInfo.platform}"></div>`);
	await editors.addScript(view, './panel.js');
	await editors.addScript(view, './style/reset.css');
	await editors.addScript(view, './style/main.css');
	await editors.addScript(view, './vendor/coloris/coloris.css');
	await editors.addScript(view, './vendor/coloris/coloris.js');

	const updateFromSelectedNote = async () => {
		const note = await joplin.workspace.selectedNote(windowId);
		if (!note) return;
		await editors.postMessage(view, { type: 'setNote', value: { id: note.id, body: note.body }});
	}

	await editors.onUpdate(view, async (event) => {
		logger.info('onUpdate');
		if (event.noteId) {
			await editors.postMessage(
				view,
				{ type: 'setNote', value: { id: event.noteId, body: event.newBody } },
			);
		}
	});

	await editors.onActivationCheck(view, async event => {
		if (!event.noteId) return false;

		const note = await joplin.data.get([ 'notes', event.noteId ], { fields: ['body'] });
		logger.info('onActivationCheck: Handling note: ' + event.noteId);
		const isBoard = noteIsBoard(note?.body ?? '');
		logger.info('onActivationCheck: Note is board:', isBoard);
		return isBoard;
	});

	const handlers = messageHandlers(view, windowId);
	await editors.onMessage(view, async (message:IpcMessage) => {
		// These messages are internal messages sent within the app webview and can be ignored
		if ((message as any).kind === 'ReturnValueResponse') return;

		logger.info('PostMessagePlugin (Webview): Got message from webview:', message);

		if (message.type === 'isReady') {
			await updateFromSelectedNote();
			return;
		}
		
		const messageHandler = handlers[message.type];
		if (messageHandler) return messageHandler(message);

		logger.warn('Unknown message: ' + JSON.stringify(message));
	});
};

joplin.plugins.register({
	onStart: async function() {
		await joplin.settings.registerSection(settingSectionName, {
			label: 'YesYouKan',
			iconName: 'fas fa-th-list',
		});
		await joplin.settings.registerSettings(settingItems);

		await registerEditorPlugin(undefined);
		joplin.workspace.onWindowOpen(async ({ windowId }) => {
			logger.info('New window opened', windowId);
			await registerEditorPlugin(windowId);
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
				}, 200);				
			},
		});
	
		await joplin.views.menuItems.create('createKanbanBoardMenuItem', 'createKanbanBoard', MenuItemLocation.Tools, { accelerator: 'CmdOrCtrl+Alt+Shift+K' });
	},
});