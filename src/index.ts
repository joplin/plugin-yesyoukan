import joplin from 'api';
import { IpcMessage } from './utils/types';

joplin.plugins.register({
	onStart: async function() {
		const panels = joplin.views.panels;

		const view = await panels.create("panel_1");
		
		await panels.setHtml(view, '<div id="root"></div>');
		await panels.addScript(view, './panel.js');
		await panels.addScript(view, './style/reset.css');
		await panels.addScript(view, './style/main.css');

		panels.onMessage(view, async (message:IpcMessage) => {
			console.info('PostMessagePlugin (Webview): Got message from webview:', message);

			if (message.type === 'getNoteBody') {
				const response = await joplin.workspace.selectedNote();
				console.info('PostMessagePlugin (Webview): Responding with:', response);
				return response.body;
			}

			if (message.type === 'setNoteBody') {
				// const noteIds = await joplin.workspace.selectedNoteIds();
				// if (!noteIds.length) throw new Error('No note is selected');
				// const noteId = noteIds[0];
				//await joplin.data.put(['notes', noteId], null, { body: message.value });
				await joplin.commands.execute('editor.setText', message.value);
				return;
			}

			throw new Error('Unknown message: ' + JSON.stringify(message));
		});
	},
});