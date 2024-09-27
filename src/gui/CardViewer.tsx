import { Draggable } from "@hello-pangea/dnd";
import * as React from "react";
import { useMemo, useCallback, useState, useRef } from "react";
import { Card, Stack } from "src/utils/types";
import * as MarkdownIt from 'markdown-it';
import ConfirmButtons from "./ConfirmButtons";
import useOnEditorKeyDown from "./hooks/useOnEditorKeyDown";
import KebabButton, { ItemClickEventHandler } from "./KebabButton";
import moveCaretToEnd from "../utils/moveCaretToEnd";

export interface ChangeEvent {
	card: Card;
}

export type ChangeEventHandler = (event:ChangeEvent) => void;

export interface DeleteEvent {
	cardId: string;
}

export type DeleteEventHandler = (event:DeleteEvent) => void;

export interface Props {
	value: Card;
	index: number;
	isLast: boolean;
	onChange:ChangeEventHandler;
	onDelete: DeleteEventHandler;
}

const markdownIt = new MarkdownIt();

const stringToCard = (originalCard:Card, newContent:string):Card => {
	const lines = newContent.trim().split('\n');
	let title = '';
	let body = '';
	if (lines.length) {
		title = lines.splice(0, 1)[0];
		body = lines.join('\n').trim();
	}

	if (!title.trim()) title = 'Untitled';

	return {
		...originalCard,
		title,
		body,
	}
}

export default (props:Props) => {
	const card = props.value;

	const [isEditing, setIsEditing] = useState<boolean>(false);
	const editorRef = useRef<HTMLTextAreaElement>(null);

	const bodyHtml = useMemo(() => {
		return markdownIt.render(card.body);
	}, [card.body]);

	const onEditorSubmit = useCallback(() => {
		props.onChange({
			card: stringToCard(card, editorRef.current.value),
		});
		setIsEditing(false);
	}, [props.onChange, card]);

	const onEditorCancel = useCallback(() => {
		setIsEditing(false);
	}, []);

	const onDoubleClick = useCallback(() => {
		if (!isEditing) {
			setIsEditing(true);
			requestAnimationFrame(() => {
				editorRef.current.focus();
				moveCaretToEnd(editorRef.current);
			});
		}
	}, [isEditing]);

	const onEditorKeyDown = useOnEditorKeyDown({ onEditorSubmit, onEditorCancel });

	const onKebabItemClick = useCallback<ItemClickEventHandler>((event) => {
		if (event.itemId === 'edit') {
			onDoubleClick();
		} else if (event.itemId === 'delete') {
			props.onDelete({ cardId: card.id });
		} else {
			throw new Error('Unknown item ID: ' + event.itemId);
		}
	}, [onDoubleClick, props.onDelete, card.id]);

	const renderKebabButton = () => {
		return (
			<div className="kebab-button-wrapper">
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

	const renderContent = () => {
		if (!isEditing) {
			return (
				<div className="content">
					<div className="header">
						<h3 className="title">{card.title}</h3>{renderKebabButton()}
					</div>
					<p className="body" dangerouslySetInnerHTML={{ __html: bodyHtml} }></p>
				</div>
			);
		} else { // EDIT
			return (
				<div className="content -editing">
					<div className="editor">
						<textarea
							ref={editorRef}
							className="note-editor"
							onKeyDown={onEditorKeyDown}
							defaultValue={card.title + '\n\n' + card.body}
						></textarea>
						<ConfirmButtons onConfirm={onEditorSubmit} onCancel={onEditorCancel} />
					</div>
					{renderKebabButton()}
				</div>
			);
		}
	}

	return (
		<Draggable draggableId={card.id} index={props.index}>
			{(provided, snapshot) => {
				const classes = ['card'];
				if (snapshot.isDragging) classes.push('-dragging');
				if (props.isLast) classes.push('-last');
				if (isEditing) classes.push('-editing');
				return (
					<div className={classes.join(' ')} {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} onDoubleClick={onDoubleClick}>
						{renderContent()}
					</div>
				);
			}}
		</Draggable>
	);
}