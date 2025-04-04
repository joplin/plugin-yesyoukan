import { produce } from "immer";
import { useCallback } from "react";
import { CardHandler } from "../../CardViewer";
import { findCard, findCardIndex } from "../../../utils/board";
import { Board, Note, WebviewApi } from "../../../utils/types";
import { AfterSetNoteAction } from "../utils/types";
import { serializeNoteToCard } from "../../../utils/noteParser";

interface Props {
	board: Board;
	webviewApi: WebviewApi;
	afterSetNoteAction: React.MutableRefObject<AfterSetNoteAction>;
	setBoard: (value: React.SetStateAction<Board>) => void;
}

export default (props:Props) => {
	const onCreateNoteFromCard = useCallback<CardHandler>(async (event) => {
		const card = findCard(props.board, event.cardId);

		const newNote = await props.webviewApi.postMessage<Note>({
			type: 'createNote',
			value: { 
				title: card.title,
				body: card.body,
			}
		});

		const newBoard = produce(props.board, draft => {
			const [stackIndex, cardIndex] = findCardIndex(draft, event.cardId);
			const card = draft.stacks[stackIndex].cards[cardIndex];
			draft.stacks[stackIndex].cards[cardIndex] = {
				...card,
				...serializeNoteToCard(newNote),
			};
		});

		props.afterSetNoteAction.current = {
			type: 'openNote',
			noteId: newNote.id,
		};

		props.setBoard(newBoard);
	}, [props.board]);

	return onCreateNoteFromCard;
}