import * as React from 'react';
import { produce } from "immer";
import { useMemo, useEffect } from "react";
import { getCardNoteIds, getCardTags } from "../../../utils/board";
import { Board, WebviewApi } from "../../../utils/types"
import usePrevious from '../../hooks/usePrevious';
import { parseAsNoteLink } from '../../../utils/noteParser';

interface Props {
	board: Board;
	webviewApi: WebviewApi;
	markAsCompletedLastStackCards: boolean;
	setBoard: (value: React.SetStateAction<Board>) => void;
}

export default (props:Props) => {
	const previousBoard = usePrevious<Board>(props.board, null);

	return useEffect(() => {
		if (!props.markAsCompletedLastStackCards) return;
		if (!previousBoard) return;
		if (!props.board.stacks.length || !previousBoard.stacks.length) return;

		const previousLastStack = previousBoard.stacks[previousBoard.stacks.length - 1];

		const newBoard = produce(props.board, draft => {
			const lastStack = draft.stacks[draft.stacks.length - 1];

			for (const card of lastStack.cards) {
				const previousCard = previousLastStack.cards.find(c => c.id === card.id);
				if (previousCard) continue;
				
				// Card has been newly added - if it's a to-do, mark it as completed
				if (card.is_todo && !card.todo_completed) {
					const parsed = parseAsNoteLink(card.title);
					void props.webviewApi.postMessage({
						type: 'setNoteProps', 
						value: {
							noteId: parsed.id,
							props: {
								todo_completed: 1,
							}
						},
					});

					card.todo_completed = 1;
				}
			}
		});

		props.setBoard(newBoard);
	}, [props.board, props.setBoard, previousBoard, props.markAsCompletedLastStackCards]);
}