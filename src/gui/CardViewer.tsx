import { Draggable } from "@hello-pangea/dnd";
import * as React from "react";
import { useMemo, useCallback, useState, useRef } from "react";
import { Card, Stack } from "src/utils/types";
import * as MarkdownIt from 'markdown-it';
import ConfirmButtons from "./ConfirmButtons";
import useOnEditorKeyDown from "./hooks/useOnEditorKeyDown";

export interface ChangeEvent {
	card: Card;
}

export type ChangeEventHandler = (event:ChangeEvent) => void;

export interface Props {
	value: Card;
	index: number;
	isLast: boolean;
	onChange:ChangeEventHandler;
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
		return markdownIt.render(props.value.body);
	}, [props.value.body]);

	const onEditorSubmit = useCallback(() => {
		props.onChange({
			card: stringToCard(props.value, editorRef.current.value),
		});
		setIsEditing(false);
	}, [props.onChange, props.value]);

	const onEditorCancel = useCallback(() => {
		setIsEditing(false);
	}, []);

	const onDoubleClick = useCallback(() => {
		if (!isEditing) {
			setIsEditing(true);
			requestAnimationFrame(() => editorRef.current.focus());
		}
	}, [isEditing]);

	const onEditorKeyDown = useOnEditorKeyDown({ onEditorSubmit, onEditorCancel });

	const renderContent = () => {
		if (!isEditing) {
			return (
				<>
					<h3 className="title">{card.title}</h3>
					<p className="body" dangerouslySetInnerHTML={{ __html: bodyHtml} }></p>
				</>
			);
		} else { // EDIT
			return (
				<div className="editor">
					<textarea
						ref={editorRef}
						className="note-editor"
						onKeyDown={onEditorKeyDown}
						defaultValue={card.title + '\n\n' + card.body}
					></textarea>
					<ConfirmButtons onConfirm={onEditorSubmit} onCancel={onEditorCancel} />
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