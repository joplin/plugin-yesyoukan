import { produce } from "immer";
import { useEffect, useState } from "react";
import { findCardIndex, getCardNoteIds } from "../../../utils/board";
import getHash from "../../../utils/getHash";
import { parseAsNoteLink } from "../../../utils/noteParser";
import { Board, CardToRender, RenderedCard, Tag, WebviewApi } from "../../../utils/types";

interface Props {
	board: Board;
	webviewApi: WebviewApi;
	setBoard: (value: React.SetStateAction<Board>) => void;
}

export default (props:Props) => {
	const [cssStrings, setCssStrings] = useState([]);
	
	useEffect(() => {
		let cancelled = false;
		const fn = async () => {
			const cardsToRender:Record<string, CardToRender> = {};
			const bodyHtmlHashes:Record<string, string> = {};
			const cardIdToNoteId = getCardNoteIds(props.board);
			const noteIds:string[] = [];

			for (const stack of props.board.stacks) {
				for (const card of stack.cards) {
					const bodyHash = await getHash(card.title + '\n' + card.body);
					if (card.bodyHtmlHash === bodyHash) continue;

					const linkedNote = parseAsNoteLink(card.title);
					bodyHtmlHashes[card.id] = bodyHash;
					cardsToRender[card.id] = {
						source: linkedNote ? 'note' : 'card',
						noteId: linkedNote ? linkedNote.id : '',
						cardTitle: linkedNote ? linkedNote.title : card.title,
						cardBody: linkedNote ? '' : card.body,
					}

					if (cardIdToNoteId[card.id]) {
						noteIds.push(cardIdToNoteId[card.id]);
					}
				}
			}
			const promises = [
				props.webviewApi.postMessage<Record<string, RenderedCard>>({ type: 'renderBodies', value: JSON.stringify(cardsToRender) }),
				props.webviewApi.postMessage<Record<string, Tag[]>>({ type: 'getTags', value: noteIds }),
			];

			const promiseResults = await Promise.all(promises);

			const rendered = promiseResults[0] as Record<string, RenderedCard>;
			const noteIdToTags = promiseResults[1] as Record<string, Tag[]>;

			if (cancelled) return;

			const getCardIdByNoteId = (id: string) => {
				for (const [cardId, noteId] of Object.entries(cardIdToNoteId)) {
					if (id === noteId) return cardId;
				}
				throw new Error('Invalid card ID: ' + id);
			}

			props.setBoard(current => {
				return produce(current, draft => {
					for (const [cardId, result] of Object.entries(rendered)) {
						const [stackIndex, cardIndex] = findCardIndex(props.board, cardId);
						const card = draft.stacks[stackIndex].cards[cardIndex];
						card.bodyHtmlHash = bodyHtmlHashes[cardId];
						card.titleHtml = result.title.html;
						card.bodyHtml = result.body.html;
						card.noteExists = result.noteExists;
						card.is_todo = result.is_todo;
						card.todo_completed = result.todo_completed;
						card.todo_due = result.todo_due;
					}

					for (const [noteId, tags] of Object.entries(noteIdToTags)) {
						const cardId = getCardIdByNoteId(noteId);
						const [stackIndex, cardIndex] = findCardIndex(props.board, cardId);
						draft.stacks[stackIndex].cards[cardIndex].tags = tags;
					}
				});
			});

			setCssStrings(current => {
				return produce(current, draft => {
					for (const [, result] of Object.entries(rendered)) {
						for (const cssString of result.body.cssStrings) {
							if (!draft.includes(cssString)) {
								draft.push(cssString);
							}
						}
					}
				});
			});
		}

		void fn();

		return () => {
			cancelled = true;
		}
	}, [props.board, props.setBoard]);

	return { cssStrings };
}