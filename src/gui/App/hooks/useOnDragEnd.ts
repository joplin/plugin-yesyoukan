import { OnDragEndResponder } from "@hello-pangea/dnd";
import { useCallback } from "react";
import { Board } from "../../../utils/types";
import { PushUndo } from "./useHistory";
import { produce } from "immer";

interface Props {
	board: Board;
	setBoard: (value: React.SetStateAction<Board>) => void;
	pushUndo: PushUndo;
}

export default (props:Props) => {
	const onDragEnd:OnDragEndResponder = useCallback((result) => {
		const { destination, source, type } = result;

		if (!destination) return;
		if (destination.droppableId === source.droppableId && destination.index === source.index) return

		props.pushUndo(props.board);

		if (type === 'card') {
			const newBoard = produce(props.board, draft => {
				const sourceStack = draft.stacks.find(s => s.id === source.droppableId);
				const destinationStack = draft.stacks.find(s => s.id === destination.droppableId);
				const removed = sourceStack.cards.splice(source.index, 1);
				destinationStack.cards.splice(destination.index, 0, removed[0]);
			});

			props.setBoard(newBoard);
		} else if (type === "column") {
			const newBoard = produce(props.board, draft => {
				const removed = draft.stacks.splice(source.index, 1);
				draft.stacks.splice(destination.index, 0, removed[0]);
			});

			props.setBoard(newBoard);
		} else {
			throw new Error('Unknown type: ' + type);
		}
	}, [props.board]);

	return onDragEnd;
}