import joplin from 'api';
import { IpcMessage } from './utils/types';
import AsyncActionQueue from './utils/AsyncActionQueue';

const noteUpdateQueue = new AsyncActionQueue(100);

joplin.plugins.register({
	onStart: async function() {
		const panels = joplin.views.panels;

		const view = await panels.create("panel_1");
		
		await panels.setHtml(view, '<div id="root"></div>');
		await panels.addScript(view, './panel.js');
		await panels.addScript(view, './style/reset.css');
		await panels.addScript(view, './style/main.css');

		const makeNoteUpdateAction = () => {
			return async () => {
				const note = await joplin.workspace.selectedNote();
				if (!note) return;
				panels.postMessage(view, { type: 'setNoteBody', value: note.body });
			};
		};

		panels.onMessage(view, async (message:IpcMessage) => {
			console.info('PostMessagePlugin (Webview): Got message from webview:', message);

			if (message.type === 'getNoteBody') {
				const response = await joplin.workspace.selectedNote();
				console.info('PostMessagePlugin (Webview): Responding with:', response);
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
	},
});