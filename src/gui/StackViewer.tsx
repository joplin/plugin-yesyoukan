import * as React from "react";
import { useCallback, useState, useRef } from "react";
import { Stack } from "src/utils/types";
import CardViewer, { EditorSubmitHandler as CardEditorSubmitEventHandler, DeleteEventHandler as CardDeleteEventHandler, EditorCancelHandler as CardEditorCancelHandler, EditorStartHandler as CardEditorStartEventHandler } from "./CardViewer";
import { Draggable, DraggableProvided, Droppable } from "@hello-pangea/dnd";
import ConfirmButtons from "./ConfirmButtons";
import useOnEditorKeyDown from "./hooks/useOnEditorKeyDown";
import KebabButton, { ItemClickEventHandler } from "./KebabButton";
import Button from "./Button";

export interface TitleChangeEvent {
	stackId: string;
	title: string;
}

export interface DeleteEvent {
	stackId: string;
}

export interface AddCardEvent {
	stackId: string;
}

export type TitleChangeEventHandler = (event:TitleChangeEvent) => void;
export type DeleteEventHandler = (event:DeleteEvent) => void;
export type AddCardEventHandler = (event:AddCardEvent) => void;

interface Props {
	value: Stack;
	index: number;
	editedCardIds: string[];
	onCardEditorStart: CardEditorStartEventHandler;
	onCardEditorSubmit: CardEditorSubmitEventHandler;
	onCardEditorCancel: CardEditorCancelHandler;
	onTitleChange: TitleChangeEventHandler;
	onDelete: DeleteEventHandler;
	onAddCard: AddCardEventHandler;
	onDeleteCard: CardDeleteEventHandler;
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
			props.onDelete({ stackId: props.value.id });
		} else {
			throw new Error('Unknown item ID: ' + event.itemId);
		}
	}, [onStartEditing, props.value.id]);

	const onAddCard = useCallback(() => {
		props.onAddCard({ stackId: props.value.id });
	}, [props.onAddCard, props.value.id]);

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
				<Button title="Add card" icon="fas fa-plus" onClick={onAddCard} />
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
			output.push(<CardViewer
				onEditorStart={props.onCardEditorStart}
				onEditorSubmit={props.onCardEditorSubmit}
				onEditorCancel={props.onCardEditorCancel}
				onDelete={props.onDeleteCard}
				isLast={index === props.value.cards.length - 1}
				index={index}
				key={card.id}
				value={card}
				isEditing={props.editedCardIds.includes(card.id)}
			/>);
		}
		return output;
	}

	return (
		<Draggable draggableId={props.value.id} index={props.index}>
			{(provided, snapshot) => {
				const classes = ['stack'];
				if (snapshot.isDragging) classes.push('-dragging');
				return (
					<div className={classes.join(' ')} {...provided.draggableProps} ref={provided.innerRef}>
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