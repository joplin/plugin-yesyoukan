import { Draggable } from "@hello-pangea/dnd";
import * as React from "react";
import { useCallback, useRef, useEffect, useMemo } from "react";
import { Card, ConfirmKey, NewlineKey, Platform } from "../utils/types";
import ConfirmButtons from "./ConfirmButtons";
import useOnEditorKeyDown from "./hooks/useOnEditorKeyDown";
import KebabButton, { ItemClickEventHandler, MenuItem } from "./KebabButton";
import moveCaretToEnd from "../utils/moveCaretToEnd";
import Logger from "@joplin/utils/Logger";
import { parseAsNoteLink } from "../utils/noteParser";

const logger = Logger.create('CardViewer');

export interface ChangeEvent {
	card: Card;
}

export interface CardEvent {
	cardId: string;
}

export type EditorStartHandler = (event:ChangeEvent) => void;
export type EditorSubmitHandler = (event:ChangeEvent) => void;
export type EditorCancelHandler = (event:ChangeEvent) => void;
export type CardHandler = (event:CardEvent) => void;

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
	onScrollToCard: CardHandler;
	onCreateNoteFromCard: CardHandler;
	onOpenAssociatedNote: CardHandler;
	isEditing: boolean;
	platform: Platform;
}

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

	const parsedTitle = useMemo(() => {
		return parseAsNoteLink(card.title);
	}, [card.title]);

	const cardTitle = parsedTitle ? parsedTitle.title : card.title;
	const associatedNoteId = parsedTitle ? parsedTitle.id : null;
	const isNoteLink = !!parsedTitle;

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
			if (isNoteLink) {
				props.onOpenAssociatedNote({ cardId: card.id });
			} else {
				props.onEditorStart({ card });
			}
		}
	}, [props.isEditing, card, isNoteLink, props.onOpenAssociatedNote]);

	useEffect(() => {
		if (props.isEditing) {
			requestAnimationFrame(() => {
				editorRef.current.focus();
				moveCaretToEnd(editorRef.current);
			});
		}
	}, [props.isEditing]);

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
		} else if (event.itemId === 'scrollToCard') {
			props.onScrollToCard({ cardId: card.id });
		} else if (event.itemId === 'createNoteFromCard') {
			props.onCreateNoteFromCard({ cardId: card.id });
			throw new Error('Unknown item ID: ' + event.itemId);
		}
	}, [onDoubleClick, props.onDelete, card.id]);

	const renderKebabButton = () => {
		const menuItems:MenuItem[] = [];

		if (props.platform === "desktop" && !isNoteLink) {
			menuItems.push({
				id: 'scrollToCard',
				label: 'Open in note',
			});
		}

		if (!isNoteLink) {
			menuItems.push({
				id: 'createNoteFromCard',
				label: 'Create note from card',
			});
		}
			
		menuItems.push({
			id: 'edit',
			label: 'Edit',
		});

		menuItems.push({
			id: 'delete',
			label: 'Delete',
		});

		return (
			<div className="kebab-button-wrapper">
				<KebabButton
					menuItems={menuItems}
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
						<h3 className="title" dangerouslySetInnerHTML={{ __html: card.titleHtml} }></h3>{renderKebabButton()}
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