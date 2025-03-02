import { produce } from "immer";
import { useCallback, useState } from "react"
import { Board } from "../../../utils/types";

interface HistoryItem {
	board: Board;
}

interface History {
	undo: HistoryItem[];
	redo: HistoryItem[];
}

const emptyHistory = ():History => {
	return {
		undo: [],
		redo: [],
	}
}

export type PushUndo = (board:Board) => void;
export type ClearUndo = () => void;

interface Props {
	board: Board;
	setBoard: (value: React.SetStateAction<Board>) => void;
}

export default (props:Props) => {
	const [history, setHistory] = useState<History>(emptyHistory);

	const pushUndo = (board:Board) => {
		setHistory(current => {
			return produce(current, draft => {
				draft.undo.push({ board });
				draft.redo = [];
			}); 
		});
	}

	const clearUndo = () => {
		setHistory(emptyHistory());
	}

	const onUndoBoard = useCallback(() => {
		if (history.undo.length) {
			const undoItem = history.undo[history.undo.length - 1];
			setHistory(current => {
				return produce(current, draft => {
					draft.redo.push({ board: props.board });
					draft.undo.pop();
				});
			});
			props.setBoard(undoItem.board);
		}
	}, [history, props.setBoard, props.board]);

	const onRedoBoard = useCallback(() => {
		if (history.redo.length) {
			const redoItem = history.redo[history.redo.length - 1];
			setHistory(current => {
				const newHistory = produce(current, draft => {
					draft.undo.push({ board: props.board });
					draft.redo.pop();
				});
				return newHistory;
			});
			props.setBoard(redoItem.board);
		}
	}, [history, props.setBoard, props.board]);

	return { history, onUndoBoard, onRedoBoard, pushUndo, clearUndo }
}