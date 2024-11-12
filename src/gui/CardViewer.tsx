import { Draggable } from "@hello-pangea/dnd";
import * as React from "react";
import { useCallback, useRef, useEffect } from "react";
import { Card, ConfirmKey, NewlineKey } from "src/utils/types";
import ConfirmButtons from "./ConfirmButtons";
import useOnEditorKeyDown from "./hooks/useOnEditorKeyDown";
import KebabButton, { ItemClickEventHandler } from "./KebabButton";
import moveCaretToEnd from "../utils/moveCaretToEnd";
import Logger from "@joplin/utils/Logger";

const logger = Logger.create('CardViewer');

export interface ChangeEvent {
	card: Card;
}

export type EditorStartHandler = (event:ChangeEvent) => void;
export type EditorSubmitHandler = (event:ChangeEvent) => void;
export type EditorCancelHandler = (event:ChangeEvent) => void;

export interface DeleteEvent {
	cardId: string;
}

export type DeleteEventHandler = (event:DeleteEvent) => void;

export interface Props {
	value: Card;
	index: number;
	isLast: boolean;
	confirmKey: ConfirmKey;
	newlineKey: NewlineKey;
	onEditorStart:EditorStartHandler;
	onEditorSubmit:EditorSubmitHandler;
	onEditorCancel: EditorCancelHandler;
	onDelete: DeleteEventHandler;
	isEditing: boolean;
}

function toggleCheckboxLine(ipcMessage: string, noteBody: string) {
	const newBody = noteBody.split('\n');
	const p = ipcMessage.split(':');
	const lineIndex = Number(p[p.length - 1]);
	if (lineIndex >= newBody.length) {
		logger.warn('Checkbox line out of bounds: ', ipcMessage);
		return newBody.join('\n');
	}

	let line = newBody[lineIndex];

	const noCrossIndex = line.trim().indexOf('- [ ] ');
	let crossIndex = line.trim().indexOf('- [x] ');
	if (crossIndex < 0) crossIndex = line.trim().indexOf('- [X] ');

	if (noCrossIndex < 0 && crossIndex < 0) {
		logger.warn('Could not find matching checkbox for message: ', ipcMessage);
		return newBody.join('\n');
	}

	let isCrossLine = false;

	if (noCrossIndex >= 0 && crossIndex >= 0) {
		isCrossLine = crossIndex < noCrossIndex;
	} else {
		isCrossLine = crossIndex >= 0;
	}

	if (!isCrossLine) {
		line = line.replace(/- \[ \] /, '- [x] ');
	} else {
		line = line.replace(/- \[x\] /i, '- [ ] ');
	}
	return [newBody, lineIndex, line];
}

const toggleCheckbox = function(ipcMessage: string, noteBody: string) {
	const [newBody, lineIndex, line] = toggleCheckboxLine(ipcMessage, noteBody);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	(newBody as any)[lineIndex as any] = line;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	return (newBody as any).join('\n');
};

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

	const editorRef = useRef<HTMLTextAreaElement>(null);

	const onEditorSubmit = useCallback(() => {
		props.onEditorSubmit({
			card: stringToCard(card, editorRef.current.value),
		});
	}, [props.onEditorSubmit, card]);

	const onEditorCancel = useCallback(() => {
		props.onEditorCancel({ card })
	}, []);

	const onDoubleClick = useCallback(() => {
		if (!props.isEditing) {
			props.onEditorStart({ card });
		}
	}, [props.isEditing, card]);

	useEffect(() => {
		if (props.isEditing) {
			requestAnimationFrame(() => {
				editorRef.current.focus();
				moveCaretToEnd(editorRef.current);
			});
		}
	}, [props.isEditing]);

	const onWindowMessage = useCallback((event: MessageEvent<any>) => {
		const message = event.data;

		if (typeof message === 'string' && message.startsWith('checkboxclick:')) {
			const newBody = toggleCheckbox(event.data, card.body);
			props.onEditorSubmit({
				card: stringToCard(card, card.title + '\n\n' + newBody),
			});
		}
	}, [card, props.onEditorSubmit]);

	useEffect(() => {
		window.addEventListener("message", onWindowMessage);
		
		return () => {
			window.removeEventListener('message', onWindowMessage);
		}
	}, [onWindowMessage]);

	const onEditorKeyDown = useOnEditorKeyDown({
		onEditorSubmit,
		onEditorCancel,
		confirmKey: props.confirmKey,
		newlineKey: props.newlineKey,
		tabKeyEnabled: true,
	});

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
		if (!props.isEditing) {
			return (
				<div className="content">
					<div className="header">
						<h3 className="title">{card.title}</h3>{renderKebabButton()}
					</div>
					<p className="body" dangerouslySetInnerHTML={{ __html: card.bodyHtml} }></p>
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
				if (props.isEditing) classes.push('-editing');
				return (
					<div className={classes.join(' ')} {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} onDoubleClick={onDoubleClick}>
						{renderContent()}
					</div>
				);
			}}
		</Draggable>
	);
}