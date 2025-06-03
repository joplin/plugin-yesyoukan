import { useEffect } from "react";
import { WebviewApi } from "src/utils/types";

interface Props {
	webviewApi: WebviewApi;
}

export default (props:Props) => {
	return useEffect(() => {
		if (!props.webviewApi.menuPopupFromTemplate) return; // For backward compatibility

		document.addEventListener('contextmenu', (event: MouseEvent) => {
			const target = event.target;
			const url = (target as HTMLAnchorElement).href;
			if (!url) return;

			event.preventDefault();			

			props.webviewApi.menuPopupFromTemplate([
				{
					label: 'Open link',
					command: 'openItem',
					commandArgs: [url],
				},

				{
					label: 'Copy link to clipboard',
					command: 'copyToClipboard',
					commandArgs: [url],
				},
			]);
		});
	}, []);	
}