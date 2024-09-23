import * as React from "react";
import { useCallback, useState, useRef } from "react";
import { Stack } from "src/utils/types";
import CardViewer, { ChangeEventHandler as CardChangeEventHandler } from "./CardViewer";
import { Draggable, DraggableProvided, Droppable } from "@hello-pangea/dnd";
import ConfirmButtons from "./ConfirmButtons";
import useOnEditorKeyDown from "./hooks/useOnEditorKeyDown";
import KebabButton, { ItemClickEventHandler } from "./KebabButton";

export interface TitleChangeEvent {
	stackId: string;
	title: string;
}

export type TitleChangeEventHandler = (event:TitleChangeEvent) => void;

interface Props {
	value: Stack;
	index: number;
	onCardChange: CardChangeEventHandler;
	onTitleChange: TitleChangeEventHandler;
}

export default (props:Props) => {
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const editorRef = useRef<HTMLInputElement>(null);

	const onStartEditing = useCallback(() => {
		setIsEditing(true);
		requestAnimationFrame(() => editorRef.current.focus());
	}, []);

	const onTitleDoubleClick = useCallback(() => {
		onStartEditing();
	}, [onStartEditing]);

	const onEditorSubmit = useCallback(() => {
		props.onTitleChange({
			stackId: props.value.id,
			title: editorRef.current.value,
		});
		setIsEditing(false);
	}, [props.value, props.onTitleChange, props.value.id]);

	const onEditorCancel = useCallback(() => {
		setIsEditing(false);
	}, []);

	const onEditorKeyDown = useOnEditorKeyDown({ onEditorSubmit, onEditorCancel });

	const onKebabItemClick = useCallback<ItemClickEventHandler>((event) => {
		if (event.itemId === 'edit') {
			onStartEditing();
		} else if (event.itemId === 'delete') {

		} else {
			throw new Error('Unknown item ID: ' + event.itemId);
		}
	}, [onStartEditing]);

	const renderTitle = () => {
		if (!isEditing) {
			return (
				<div className="title-wrapper">
					<h2 className="title">{props.value.title}</h2>
				</div>
			);
		} else {
			return (
				<div className="title-wrapper">
					<input type="text" onKeyDown={onEditorKeyDown} className="titleedit" defaultValue={props.value.title} ref={editorRef} />
					<ConfirmButtons className="buttons" showConfirm={false} onConfirm={onEditorSubmit} onCancel={onEditorCancel} />
				</div>
			);
		}
	}

	const renderHeadingButtons = () => {
		return (
			<div className="buttons">
				<KebabButton
					menuItems={[
						{
							id: 'edit',
							label: 'Edit',
						},
						{
							id: 'delete',
							label: 'Delete',
						},
					]}
					onItemClick={onKebabItemClick}
				/>
			</div>
		);
	}

	const renderCards = () => {
		const output:React.JSX.Element[] = [];
		for (let [index, card] of props.value.cards.entries()) {
			output.push(<CardViewer onChange={props.onCardChange} isLast={index === props.value.cards.length - 1} index={index} key={card.id} value={card}/>);
		}
		return output;
	}

	return (
		<Draggable draggableId={props.value.id} index={props.index}>
			{(provided) => {
				return (
					<div className="stack" {...provided.draggableProps} ref={provided.innerRef}>
						<div onDoubleClick={onTitleDoubleClick} className="stack-header" {...provided.dragHandleProps}>
							{renderTitle()}
							{renderHeadingButtons()}
						</div>
						<Droppable droppableId={props.value.id} type="card">
							{(provided, snapshot) => {
								const classes = ['cards'];
								if (snapshot.isDraggingOver) classes.push('-dragging-over');
								return (
									<div className={classes.join(' ')} {...provided.droppableProps} ref={provided.innerRef}>
										{renderCards()}
										{provided.placeholder}
									</div>
								);
							}}
						</Droppable>
					</div>
				);
			}}
		</Draggable>
	);
}