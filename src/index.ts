import joplin from 'api';
import { IpcMessage, Note, settingItems, settingSectionName } from './utils/types';
import { boardsEqual, noteIsBoard, parseNote } from './utils/noteParser';
import Logger, { TargetType } from '@joplin/utils/Logger';
import { MenuItemLocation } from 'api/types';
import { msleep } from './utils/time';

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

joplin.plugins.register({
	onStart: async function() {
		await joplin.settings.registerSection(settingSectionName, {
			label: 'YesYouKan',
			iconName: 'fas fa-th-list',
		});
		await joplin.settings.registerSettings(settingItems);

		const editors = joplin.views.editors;

		const view = await editors.create("kanbanBoard");
		
		await editors.setHtml(view, '<div id="root"></div>');
		await editors.addScript(view, './panel.js');
		await editors.addScript(view, './style/reset.css');
		await editors.addScript(view, './style/main.css');

		const updateFromSelectedNote = async () => {
			const note = await joplin.workspace.selectedNote();
			if (!note) return;

			await editors.postMessage(view, { type: 'setNote', value: { id: note.id, body: note.body }});
		}

		await editors.onActivationCheck(view, async () => {
			const note = await joplin.workspace.selectedNote();
			if (!note) return false;

			logger.info('onActivationCheck: Handling note: ' + note.id);
			return noteIsBoard(note ? note.body : '');
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
			logger.info('PostMessagePlugin (Webview): Got message from webview:', message);

			if (message.type === 'isReady') {
				await updateFromSelectedNote();
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
					const result = await joplin.commands.execute('renderMarkup', 1, body, null, { postMessageSyntax: 'cardPostMessage("' + id  + '")'});
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

			if (message.type === 'openItem') {
				await joplin.commands.execute('openItem', message.value);
				return;
			}

			if (message.type === 'getSettings') {
				return await (joplin.settings as any).values(Object.keys(settingItems));
			}

			if (message.type === 'scrollToCard') {
				await joplin.commands.execute('showEditorPlugin', null, false);
				await msleep(500);
				await joplin.commands.execute('editor.scrollToText', { text: message.value.cardTitle , element: 'h2' });
				return;
			}

			logger.warn('Unknown message: ' + JSON.stringify(message));
		});
	},
});