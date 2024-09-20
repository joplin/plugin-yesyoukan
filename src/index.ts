import joplin from 'api';

joplin.plugins.register({
	onStart: async function() {
		const panels = joplin.views.panels;

		const view = await panels.create("panel_1");
		
		await panels.setHtml(view, '<div id="root"></div>');
		await panels.addScript(view, './panel.js');
		await panels.addScript(view, './styles.css');

		panels.onMessage(view, async (message:string) => {
			console.info('PostMessagePlugin (Webview): Got message from webview:', message);
			const response = await joplin.workspace.selectedNote();
			console.info('PostMessagePlugin (Webview): Responding with:', response);
			return response.body;
		});
	},
});