import joplin from 'api';
import { IpcMessage } from './utils/types';
import AsyncActionQueue from './utils/AsyncActionQueue';
import { noteIsBoard } from './utils/noteParser';
import Logger, { TargetType } from '@joplin/utils/Logger';

const globalLogger = new Logger();
globalLogger.addTarget(TargetType.Console);
Logger.initializeGlobalLogger(globalLogger);

const logger = Logger.create('YesYouCan: Index');

const noteUpdateQueue = new AsyncActionQueue(10);

joplin.plugins.register({
	onStart: async function() {
		const panels = joplin.views.panels;

		const view = await panels.create("panel_1");
		
		await panels.setHtml(view, '<div id="root"></div>');
		await panels.addScript(view, './panel.js');
		await panels.addScript(view, './style/reset.css');
		await panels.addScript(view, './style/main.css');

		let panelEnabled = false;

		const makeNoteUpdateAction = () => {
			return async () => {
				const note = await joplin.workspace.selectedNote();
				if (!noteIsBoard(note ? note.body : '')) {
					logger.info('Note is not a Kanban board - hiding panel');
					await panels.hide(view);
					panelEnabled = false;
					return;
				}

				panelEnabled = true;
				await panels.show(view);
				panels.postMessage(view, { type: 'setNoteBody', value: note.body });
			};
		};

		panels.onMessage(view, async (message:IpcMessage) => {
			logger.info('PostMessagePlugin (Webview): Got message from webview:', message);

			if (!panelEnabled) {
				logger.info('Skipping message - panel is disabled');
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