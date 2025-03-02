import { useEffect, useRef, useState } from "react";
import { boardsEqual, noteIsBoard, parseNote, serializeBoard } from "../../../utils/noteParser";
import { Board, Note, WebviewApi } from "../../../utils/types";
import { ClearUndo } from "./useHistory";
import Logger from "@joplin/utils/Logger";
import AsyncActionQueue from "../../../utils/AsyncActionQueue";
import { AfterSetNoteAction } from "../utils/types";

const logger = Logger.create('YesYouKan: useNoteLoader');

const updateNoteQueue = new AsyncActionQueue(100);

interface Props {
	board: Board;
	webviewApi: WebviewApi;
	setBoard: (value: React.SetStateAction<Board>) => void;
	clearUndo: ClearUndo;
	afterSetNoteAction: React.MutableRefObject<AfterSetNoteAction>;
}

export default (props:Props) => {
	const [isReadySent, setIsReadySent] = useState<boolean>(false);
	const [enabled, setEnabled] = useState<boolean>(false);
	const ignoreNextBoardUpdate = useRef<boolean>(false);

	useEffect(() => {
		const fn = async() => {
			if (isReadySent) return;
			setIsReadySent(true);
			logger.info('Sending isReady message...');
			await props.webviewApi.postMessage<string>({ type: 'isReady' });
		}

		void fn();
	}, [isReadySent]);
	
	useEffect(() => {
		const fn = async() => {
			const note = await props.webviewApi.postMessage<Note>({ type: 'getNote' });
			if (!noteIsBoard(note.body)) {
				setEnabled(false);
				return;
			}
			const newBoard = await parseNote(note.id, note.body);
			setEnabled(true);
			props.setBoard(newBoard);
		}

		void fn();
	}, []);

	useEffect(() => {
		props.webviewApi.onMessage(async (event) => {
			const message = event.message;

			if (!enabled) return;

			if (message.type === 'setNote') {
				const note = message.value as Note;
				const newBoard = await parseNote(note.id, note.body);
				props.setBoard(current => {
					if (boardsEqual(current, newBoard)) {
						logger.info('Board has not changed - skipping update');
						return current;
					}
					logger.info('Boad has changed - updating');
					props.clearUndo();
					ignoreNextBoardUpdate.current = true;
					return newBoard;
				});
			} else {
				logger.warn('Unknown message:' + JSON.stringify(message));
			}
		});
	}, [enabled]);

	useEffect(() => {
		if (!ignoreNextBoardUpdate.current) {
			updateNoteQueue.push(async () => {
				logger.info('Boad has changed - updating note body...');
				const noteBody = serializeBoard(props.board);
				await props.webviewApi.postMessage({ type: 'setNote', value: { id: props.board.noteId, body: noteBody }});

				if (props.afterSetNoteAction.current) {
					const action = props.afterSetNoteAction.current;
					props.afterSetNoteAction.current = null;
					if (action.type === 'openNote') {
						await props.webviewApi.postMessage({ type: 'openNote', value: action.noteId });
					}
				}
			});
		}
		ignoreNextBoardUpdate.current = false;
	}, [props.board]);
}