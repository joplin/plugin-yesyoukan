import * as React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { useCallback, useRef, useEffect, useMemo } from "react";
import { AppSettings, Card, CardDoubleClickAction, ConfirmKey, NewlineKey, Platform } from "../utils/types";
import ConfirmButtons from "./ConfirmButtons";
import useOnEditorKeyDown from "./hooks/useOnEditorKeyDown";
import KebabButton, { ItemClickEventHandler, MenuItem } from "./KebabButton";
import moveCaretToEnd from "../utils/moveCaretToEnd";
import Logger from "@joplin/utils/Logger";
import { parseAsNoteLink } from "../utils/noteParser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDateTime } from "../utils/time";

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
	key:string;
	value: Card;
	appSettings: AppSettings;
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
	onEditSettings: CardHandler;
	onDuplicate: CardHandler;
	cardDoubleClickAction: CardDoubleClickAction;
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

	const isNoteLink = !!parsedTitle && card.noteExists;

	const cardHasChanged = useCallback(() => {
		const newCard = stringToCard(card, editorRef.current.value);
		return newCard.title !== card.title || newCard.body !== card.body;
	}, [editorRef, card]);

	const onEditorSubmit = useCallback(() => {
		props.onEditorSubmit({
			card: stringToCard(card, editorRef.current.value),
		});
	}, [props.onEditorSubmit, card]);

	const onEditorCancel = useCallback(() => {
		const ok = cardHasChanged() ? confirm('All your changes will be lost - continue?') : true;
		if (!ok) {
			return;
		} else {
			props.onEditorCancel({ card })
		}
	}, [cardHasChanged, props.onEditorCancel, card]);

	const onEdit = useCallback((cardDoubleClickAction:CardDoubleClickAction|null = null) => {
		if (!props.isEditing) {
			if (isNoteLink) {
				props.onOpenAssociatedNote({ cardId: card.id });
			} else {
				const actions:Record<CardDoubleClickAction, () => void> = {
					[CardDoubleClickAction.openInBoard]: () => {
						props.onEditorStart({ card });
					},
					[CardDoubleClickAction.openInNote]: () => {
						props.onScrollToCard({ cardId: card.id });
					},
				}
				
				actions[cardDoubleClickAction ? cardDoubleClickAction : props.cardDoubleClickAction]();
			}
		}
	}, [props.isEditing, card, isNoteLink, props.cardDoubleClickAction, props.onOpenAssociatedNote]);

	const onDoubleClick = useCallback(() => {
		onEdit();
	}, [onEdit]);

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

	const onSaveAndScrollToCard = useCallback(() => {
		if (props.isEditing) {
			// First save, otherwise the changes will be lost. And we need a delay to give time to
			// the IPC call to save the note.
			onEditorSubmit();
			setTimeout(() => {
				props.onScrollToCard({ cardId: card.id });
			}, 1000);
		} else {
			props.onScrollToCard({ cardId: card.id });
		}
	}, [card.id, onEditorSubmit, props.isEditing, props.onScrollToCard]);

	const onKebabItemClick = useCallback<ItemClickEventHandler>((event) => {
		if (event.itemId === 'edit') {
			onEdit(CardDoubleClickAction.openInBoard);
		} else if (event.itemId === 'delete') {
			props.onDelete({ cardId: card.id });
		} else if (event.itemId === 'duplicate') {
			props.onDuplicate({ cardId: card.id });
		} else if (event.itemId === 'scrollToCard') {
			onSaveAndScrollToCard();
		} else if (event.itemId === 'createNoteFromCard') {
			props.onCreateNoteFromCard({ cardId: card.id });
		} else if (event.itemId === 'editSettings') {
			props.onEditSettings({ cardId: card.id });
		} else {
			throw new Error('Unknown item ID: ' + event.itemId);
		}
	}, [onDoubleClick, props.onDelete, card.id, onSaveAndScrollToCard]);

	const renderKebabButton = () => {
		const menuItems:MenuItem[] = [];

		if (props.platform === "desktop" && !isNoteLink) {
			menuItems.push({
				id: 'scrollToCard',
				label: 'Open in note...',
			});
		}

		if (!isNoteLink) {
			menuItems.push({
				id: 'createNoteFromCard',
				label: 'Create note from card...',
			});
		}

		if (menuItems.length) {
			menuItems.push({
				isDivider: true,
			});
		}
			
		menuItems.push({
			id: 'edit',
			label: 'Edit',
		});

		menuItems.push({
			id: 'duplicate',
			label: 'Duplicate',
		});

		menuItems.push({
			id: 'delete',
			label: 'Delete',
		});

		menuItems.push({
			isDivider: true,
		});

		menuItems.push({
			id: 'editSettings',
			label: 'Properties...',
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

	const renderTags = () => {
		if (!card.tags || !card.tags.length) return null;

		const tagComponents = [];

		for (const tag of card.tags) {
			tagComponents.push(<div key={tag.id} className="tag">{tag.title}</div>);
		}

		return (
			<div className="tags">
				{tagComponents}
			</div>
		);
	}

	const renderDueDate = () => {
		if (!card.is_todo) return null;
		if (!card.todo_due) return null;

		const isOverdue = !card.todo_completed && card.todo_due <= Date.now();

		const dateClasses = ['date'];
		if (card.todo_completed) dateClasses.push('-done');
		if (isOverdue) dateClasses.push('-overdue');

		const icon = isOverdue ? "triangle-exclamation" : "clock";
		
		return (
			<div className="duedate">
				<FontAwesomeIcon className="icon" icon={icon} /><span className={dateClasses.join(' ')}>{formatDateTime(card.todo_due, props.appSettings.dateFormat + ' ' + props.appSettings.timeFormat)}</span>
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
					{renderTags()}
					{renderDueDate()}
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

	const cardClasses = useMemo(() => {
		const classes = ['card'];

		if (card.settings?.backgroundColor) {
			classes.push('background-' + card.settings.backgroundColor);
		}

		if (props.isLast) classes.push('-last');
		if (props.isEditing) classes.push('-editing');

		return classes;
	}, [card.settings?.backgroundColor, props.isLast, props.isEditing]);
	
	return (
		<Draggable draggableId={card.id} index={props.index}>
			{(provided, snapshot) => {
				let classes = cardClasses;
				if (snapshot.isDragging) classes.slice().push('-dragging');
				return (
					<div className={classes.join(' ')} {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} onDoubleClick={onDoubleClick}>
						{renderContent()}
					</div>
				);
			}}
		</Draggable>
	);
}