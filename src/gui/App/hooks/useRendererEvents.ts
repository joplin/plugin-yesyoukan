import { useEffect, useState } from "react";
import { Board, IpcMessage, WebviewApi } from "../../../utils/types";
import { produce } from "immer";
import { findCardIndex } from "../../../utils/board";
import { toggleCheckbox } from "../../../utils/renderMarkupUtils";
import { parseAsNoteLink } from "../../../utils/noteParser";

// We support anything that looks like a URL - we just want to send it back to the app via the
// `openItem` command.
const isSupportedUrl = (text:string) => {
	return !!text.match(/^[a-zA-Z\-]+:.+/);
}

interface Props {
	webviewApi: WebviewApi;
	setBoard: (value: React.SetStateAction<Board>) => void;
}

export default (props:Props) => {
	const [noteCheckboxToUpdate, setNoteCheckboxToUpdate] = useState(null);

	useEffect(() => {
		const handleUrl = async (message:string) => {
			if (isSupportedUrl(message)) {
				await props.webviewApi.postMessage<string>({ type: 'openItem', value: message });
			}
		}

		const onMessage = async (event: MessageEvent<any>) => {
			const message = event.data;

			// These messages are internal messages sent within the (mobile?) app webview and can be
			// ignored
			if ((message as any).kind === 'ReturnValueResponse') return;
			if ((message as any).postMessage?.kind === 'ReturnValueResponse') return;

			if (typeof message === 'string') {
				await handleUrl(message);
			} else {
				const asIpcMessage = message as IpcMessage;
				if (asIpcMessage && asIpcMessage.type === "cardMessage") {
					const cardId = asIpcMessage.value.cardId;
					const cardMessage = asIpcMessage.value.message as string;

					if (cardMessage.startsWith('checkboxclick:')) {
						props.setBoard(current => produce(current, draft => {
							const [stackIndex, cardIndex] = findCardIndex(current, cardId);
							const card = current.stacks[stackIndex].cards[cardIndex];
							const linkedNote = parseAsNoteLink(card.title);
							if (linkedNote) {
								setNoteCheckboxToUpdate({ cardMessage, noteId: linkedNote.id });
							} else {
								const cardBody = current.stacks[stackIndex].cards[cardIndex].body;
								const newBody = toggleCheckbox(cardMessage, cardBody);
								draft.stacks[stackIndex].cards[cardIndex].body = newBody;
							}
						}));
					} else {
						await handleUrl(cardMessage);
					}
				}
			}
		}

		window.addEventListener("message", onMessage);
		
		return () => {
			window.removeEventListener('message', onMessage);
		}
	}, [props.webviewApi, props.setBoard]);

	useEffect(() => {
		if (!noteCheckboxToUpdate) return;

		const fn = async () => {
			await props.webviewApi.postMessage({
				type: 'setNoteCheckbox',
				value: noteCheckboxToUpdate,
			});

			setNoteCheckboxToUpdate(null);
		}

		void fn();
	}, [noteCheckboxToUpdate]);

	useEffect(() => {
		// "cardPostMessage" is defined when calling the `renderMarkup` command. The checkbox
		// rendered by this command will post a message in the form `checkboxclick:<line_index>`. We
		// capture this message and send it back - it will then be processed at the app level.
		//
		// We wrap it in a second function so that we can capture the card ID, which is needed to
		// know which part of the note needs to be updated.

		const script = document.createElement('script');
		script.textContent =  `
			const cardPostMessage = (cardId) => {
				return (message) => {
					postMessage({
						type: "cardMessage",
						value: {
							cardId,
							message,
						},
					});
				};
			}
		`;
			
		document.body.appendChild(script);
		
		return () => {
			document.body.removeChild(script);
		}
	}, []);
}