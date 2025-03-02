import { produce } from "immer";
import { useEffect, useState } from "react";
import { findCardIndex, getCardNotes } from "../../../utils/board";
import getHash from "../../../utils/getHash";
import { parseAsNoteLink } from "../../../utils/noteParser";
import { Board, CardToRender, RenderedNote, Tag, WebviewApi } from "../../../utils/types";

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
			const cardIdToNoteId = getCardNotes(props.board);
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
						cardTitle: linkedNote ? '' : card.title,
						cardBody: linkedNote ? '' : card.body,
					}

					if (cardIdToNoteId[card.id]) {
						noteIds.push(cardIdToNoteId[card.id]);
					}
				}
			}
			const promises = [
				props.webviewApi.postMessage<Record<string, RenderedNote>>({ type: 'renderBodies', value: JSON.stringify(cardsToRender) }),
				props.webviewApi.postMessage<Record<string, Tag[]>>({ type: 'getTags', value: noteIds }),
			];

			const [rendered, noteIdToTags] = await Promise.all(promises);

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
						draft.stacks[stackIndex].cards[cardIndex].bodyHtmlHash = bodyHtmlHashes[cardId];
						draft.stacks[stackIndex].cards[cardIndex].titleHtml = result.title.html;
						draft.stacks[stackIndex].cards[cardIndex].bodyHtml = result.body.html;
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