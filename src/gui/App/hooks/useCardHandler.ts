import * as React from 'react';
import { produce } from "immer";
import { useCallback, useState } from "react";
import { EditorSubmitHandler as CardChangeEventHandler, DeleteEventHandler as CardDeleteEventHandler, EditorCancelHandler, EditorStartHandler, CardHandler } from "../../CardViewer";
import { Board, cardSettingItems, CardSettings, Note, WebviewApi } from "../../../utils/types";
import { PushUndo } from "./useHistory";
import { findCard, findCardIndex, findStackIndex } from "../../../utils/board";
import uuid from "../../../utils/uuid";
import { AddCardEventHandler } from "../../../gui/StackViewer";
import { parseAsNoteLink, serializeNoteToCard } from "../../../utils/noteParser";
import { DialogConfig } from "../utils/types";
import { createCard, duplicateCard } from '../../../utils/cards';

interface Props {
	board: Board;
	setBoard: (value: React.SetStateAction<Board>) => void;
	pushUndo: PushUndo;
	webviewApi: WebviewApi;
	setDialogConfig: (value: React.SetStateAction<DialogConfig>) => void;
	addCardsToBeginningOfStack: boolean;
}

export default (props:Props) => {
	const [editedCardIds, setEditedCardIds] = useState<string[]>([]);
	
	const startCardEditing = (cardId:string) => {
		setEditedCardIds(current => {
			return produce(current, draft => {
				const index = draft.findIndex(id => id === cardId);
				if (index >= 0) return;
				draft.push(cardId);
			});
		});
	}

	const stopCardEditing = (cardId:string) => {
		setEditedCardIds(current => {
			return produce(current, draft => {
				const index = draft.findIndex(id => id === cardId);
				if (index >= 0) draft.splice(index, 1);
			});
		});
	}

	const onCardEditorStart = useCallback<EditorStartHandler>((event) => {
		startCardEditing(event.card.id);
	}, []);
	
	const onCardChange = useCallback<CardChangeEventHandler>((event) => {
		props.pushUndo(props.board);

		const cardId = event.card.id;

		const newBoard = produce(props.board, draft => {
			const [stackIndex, cardIndex] = findCardIndex(draft, cardId);
			const newCard = draft.stacks[stackIndex].cards[cardIndex];
			newCard.title = event.card.title;
			newCard.body = event.card.body;
		});

		props.setBoard(newBoard);

		stopCardEditing(cardId);
	}, [props.board, props.pushUndo]);

	const onCardEditorCancel = useCallback<EditorCancelHandler>((event) => {
		stopCardEditing(event.card.id);
	}, []);

	const onAddCard = useCallback<AddCardEventHandler>((event) => {
		props.pushUndo(props.board);

		const newCardId = uuid();

		const newBoard = produce(props.board, draft => {
			const stackIndex = findStackIndex(draft, event.stackId);
			const newCard = {
				id: newCardId,
				title: 'New card',
				body: '',
				is_todo: 0,
				todo_completed: 0,
				todo_due: 0,
			}

			if (props.addCardsToBeginningOfStack) {
				draft.stacks[stackIndex].cards.unshift(newCard);
			} else {
				draft.stacks[stackIndex].cards.push(newCard);
			}
		});

		props.setBoard(newBoard);

		startCardEditing(newCardId);
	}, [props.board, props.setBoard, props.pushUndo]);

	const onDeleteCard = useCallback<CardDeleteEventHandler>(async (event) => {
		const card = findCard(props.board, event.cardId);
		const parsedTitle = parseAsNoteLink(card.title);

		if (parsedTitle) {
			// Probably better not to delete the associated note? Let's see depending on feedback

			// const answer = confirm('This will also delete the associated note. Continue?');
			// if (!answer) return;

			// await props.webviewApi.postMessage({
			// 	type: 'deleteNote',
			// 	value: parsedTitle.id
			// });
		} else {
			props.pushUndo(props.board);
		}

		const newBoard = produce(props.board, draft => {
			const [stackIndex, cardIndex] = findCardIndex(draft, event.cardId);
			draft.stacks[stackIndex].cards.splice(cardIndex, 1);
		});

		props.setBoard(newBoard);
	}, [props.board, props.pushUndo, props.setBoard, props.webviewApi]);

	const onDuplicateCard = useCallback<CardDeleteEventHandler>(async (event) => {
		const [stackIndex, cardIndex] = findCardIndex(props.board, event.cardId);
		const card = props.board.stacks[stackIndex].cards[cardIndex];
		const parsedTitle = parseAsNoteLink(card.title);

		if (parsedTitle) {
			const newNote = await props.webviewApi.postMessage<Note>({
				type: 'duplicateNote',
				value: parsedTitle.id,
			});

			const newBoard = produce(props.board, draft => {
				const newCard = createCard();
				if (props.addCardsToBeginningOfStack) {
					draft.stacks[stackIndex].cards.unshift({
						...newCard,
						...serializeNoteToCard(newNote),
					});
				} else {
					draft.stacks[stackIndex].cards.push({
						...newCard,
						...serializeNoteToCard(newNote),
					});
				}
			});

			props.setBoard(newBoard);
		} else {
			props.pushUndo(props.board);

			const newBoard = produce(props.board, draft => {
				if (props.addCardsToBeginningOfStack) {
					draft.stacks[stackIndex].cards.unshift(duplicateCard(card));
				} else {
					draft.stacks[stackIndex].cards.push(duplicateCard(card));
				}
			});
	
			props.setBoard(newBoard);
		}
	}, [props.board, props.pushUndo, props.setBoard, props.webviewApi]);

	const onEditCardSettings = useCallback<CardHandler>(async (event) => {
		const card = findCard(props.board, event.cardId);
		props.setDialogConfig({
			title: 'Card properties',
			settingItems: cardSettingItems,
			settings: { ...card.settings },
			onSave: (newSettings: CardSettings) => {
				const newBoard = produce(props.board, draft => {
					const [stackIndex, cardIndex] = findCardIndex(draft, event.cardId);
					draft.stacks[stackIndex].cards[cardIndex].settings = newSettings;
				});
				props.setBoard(newBoard);
			},
		});
	}, [props.board, props.setBoard, props.setDialogConfig]);

	return {
		editedCardIds,
		onCardEditorStart,
		onCardChange,
		onEditCardSettings,
		onDeleteCard,
		onCardEditorCancel,
		onAddCard,
		onDuplicateCard,
	};
}