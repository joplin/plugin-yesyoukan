import { useCallback } from "react";
import { StackEventHandler, TitleChangeEventHandler } from "../../../gui/StackViewer";
import { findStack, findStackIndex } from "../../../utils/board";
import { Board, stackSettingItems, StackSettings } from "../../../utils/types";
import { PushUndo } from "./useHistory";
import { DialogConfig } from "../utils/types";
import { produce } from "immer";
import uuid from "../../../utils/uuid";

interface Props {
	board: Board;
	setDialogConfig: (value: React.SetStateAction<DialogConfig>) => void;
	setBoard: (value: React.SetStateAction<Board>) => void;
	pushUndo: PushUndo;
}

export default (props:Props) => {
	const onEditStackSettings = useCallback<StackEventHandler>(async (event) => {
		const stack = findStack(props.board, event.stackId);
		props.setDialogConfig({
			title: 'Stack properties',
			settingItems: stackSettingItems,
			settings: { ...stack.settings },
			onSave: (newSettings: StackSettings) => {
				const newBoard = produce(props.board, draft => {
					const stackIndex = findStackIndex(draft, event.stackId);
					draft.stacks[stackIndex].settings = newSettings;
				});
				props.setBoard(newBoard);
			},
		});
	}, [props.board, props.setDialogConfig, props.setBoard]);

	const onStackTitleChange = useCallback<TitleChangeEventHandler>((event) => {
		props.pushUndo(props.board);

		const newBoard = produce(props.board, draft => {
			const stackIndex = findStackIndex(props.board, event.stackId);
			draft.stacks[stackIndex].title = event.title;
		});

		props.setBoard(newBoard);
	}, [props.board, props.pushUndo, props.setBoard]);

	const onStackDelete = useCallback<StackEventHandler>((event) => {
		props.pushUndo(props.board);

		const newBoard = produce(props.board, draft => {
			const stackIndex = findStackIndex(props.board, event.stackId);
			draft.stacks.splice(stackIndex, 1);
		});

		props.setBoard(newBoard);
	}, [props.board, props.pushUndo, props.setBoard]);

	const onAddStack = useCallback(() => {
		props.pushUndo(props.board);

		props.setBoard(current => {
			const newBoard = produce(current, draft => {
				draft.stacks.push({
					cards: [],
					title: 'New stack',
					id: uuid(),
				});
			});
			return newBoard;
		});
	}, [props.board, props.pushUndo, props.setBoard]);

	return {
		onEditStackSettings,
		onStackTitleChange, 
		onStackDelete,
		onAddStack,
	}
}