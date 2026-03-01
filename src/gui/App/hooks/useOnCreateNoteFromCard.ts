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
	const createNoteOrTodoFromCard = useCallback(async (cardId: string, isTodo: boolean) => {
		const card = findCard(props.board, cardId);

		const newNote = await props.webviewApi.postMessage<Note>({
			type: 'createNote',
			value: {
				title: card.title,
				body: card.body,
				is_todo: isTodo,
			}
		});

		const newBoard = produce(props.board, draft => {
			const [stackIndex, cardIndex] = findCardIndex(draft, cardId);
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

	const onCreateNoteFromCard = useCallback<CardHandler>(async (event) => {
		await createNoteOrTodoFromCard(event.cardId, false);
	}, [createNoteOrTodoFromCard]);

	const onCreateTodoFromCard = useCallback<CardHandler>(async (event) => {
		await createNoteOrTodoFromCard(event.cardId, true);
	}, [createNoteOrTodoFromCard]);

	return { onCreateNoteFromCard, onCreateTodoFromCard };
}