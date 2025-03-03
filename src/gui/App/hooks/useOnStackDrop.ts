import Logger from "@joplin/utils/Logger";
import { produce } from "immer";
import { useCallback } from "react";
import { StackDropEventHandler } from "../../../gui/StackViewer";
import { findStack, getAllNoteIds } from "../../../utils/board";
import createCard from "../../../utils/createCard";
import { escapeLinkUrl, escapeTitleText } from "../../../utils/markdown";
import { Board, Note, WebviewApi } from "../../../utils/types";

const logger = Logger.create('YesYouKan: useOnStackDrop');

interface Props {
	board: Board;
	setBoard: (value: React.SetStateAction<Board>) => void;
	webviewApi: WebviewApi;
}

export default (props:Props) => {
	const onStackDrop = useCallback<StackDropEventHandler>(async (event) => {
		try {
			const droppedNoteIds = event.noteIds;

			const selectedNote = await props.webviewApi.postMessage<Note>({ type: 'getNote' });

			if (droppedNoteIds.includes(selectedNote.id)) throw new Error('Cannot add board as a card');

			const notes = await props.webviewApi.postMessage<Note[]>({
				type: 'getNotes',
				value: droppedNoteIds,
			});

			const allNoteIds = getAllNoteIds(props.board);

			for (const noteId of allNoteIds) {
				if (droppedNoteIds.includes(noteId)) throw new Error('Note is already added as a card: ' + noteId);
			}

			const newBoard = produce(props.board, draft => {
				for (const note of notes) {
					const stack = findStack(draft, event.stackId);
					const newCard = createCard();
					newCard.title = `[${escapeTitleText(note.title)}](:/${escapeLinkUrl(note.id)})`
					stack.cards.splice(0, 0, newCard);
				}
			});

			props.setBoard(newBoard);
		} catch (error) {
			logger.warn(error);	
		}
	}, [props.board]);
	
	return onStackDrop;
}