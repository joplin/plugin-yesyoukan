import { Props as ButtonProps } from '../../Button';
import { useMemo } from "react";

interface Props {
	historyUndoLength: number;
	historyRedoLength: number
	onUndoBoard: () => void;
	onRedoBoard: () => void;
	onAddStack: () => void;
	onFilter: () => void;
}

export default (props:Props) => {
	const toolbarButtons = useMemo(() => {
		const output:ButtonProps[] = [
			{
				name: 'undo',
				icon: 'undo',
				disabled: !props.historyUndoLength,
				title: 'Undo',
				onClick: () => {
					props.onUndoBoard();
				},
			},

			{
				name: 'redo',
				icon: 'redo',
				disabled: !props.historyRedoLength,
				title: 'Redo',
				onClick: () => {
					props.onRedoBoard();
				},
			},

			{
				name: 'newStack',
				icon: 'plus',
				title: 'New stack',
				onClick: () => {
					props.onAddStack();
				},
			},

			{
				name: 'filter',
				icon: 'filter',
				title: 'Filter',
				onClick: () => {
					props.onFilter();
				},
			},
		];		
		return output;
	}, [props.onUndoBoard, props.onRedoBoard, props.historyUndoLength, props.historyRedoLength, props.onAddStack, props.onFilter]);

	return toolbarButtons;
}