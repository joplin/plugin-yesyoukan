import { Board, LastStackAddedDates } from "./types";
import { Day } from "./time";
import { produce } from "immer";
import { findCardIndex } from "./board";
import Logger from "@joplin/utils/Logger";
import { createCardHashes } from "./cards";

const logger = Logger.create('YesYouKan: autoArchive');

export const recordLastStackAddedDates = async (board: Board, lastStackAddedDates:LastStackAddedDates) => {
	const cardHashes = await createCardHashes(board.stacks);

	return produce(lastStackAddedDates, draft => {
		for (let stackIndex = 0; stackIndex < board.stacks.length; stackIndex++) {
			const stack = board.stacks[stackIndex];
			const isLastStack = stackIndex === board.stacks.length - 1;

			for (const card of stack.cards) {
				if (!draft[board.noteId]) draft[board.noteId] = {};

				const cardHash = cardHashes[card.id];

				if (isLastStack) {
					if (!draft[board.noteId][cardHash]) {
						draft[board.noteId][cardHash] = Date.now();
					}
				} else {
					// If it's not the last stack, we remove all the cards from the object - this
					// handles the case where a new stack is appended to the board. In which case,
					// we no longer want to archive the cards that were in the previous "last
					// stack".
					delete draft[board.noteId][cardHash];
				}
			}
		}

		const validHashes:string[] = [];
		for (const [, hash] of Object.entries(cardHashes)) {
			validHashes.push(hash);
		}

		// Now remove all the info for hashes that don't have a matching note (card has been deleted
		// or changed)
		for (const [, cardHashes] of Object.entries(draft)) {
			for (const [cardHash, ] of Object.entries(cardHashes)) {
				if (!validHashes.includes(cardHash)) {
					delete cardHashes[cardHash]; 
				}
			}
		}
	});
}

export const processAutoArchiving = async (board: Board, archive:Board, lastStackAddedDates:LastStackAddedDates, autoArchiveDelayDays:number) => {
	if (!board.stacks.length) return { board, archive };

	const lastStack = board.stacks[board.stacks.length - 1];
	const threshold = Date.now() - autoArchiveDelayDays * Day;

	const cardHashes = await createCardHashes([lastStack]);

	return produce({ board, archive }, draft => {
		const draftBoard = draft.board;
		const draftArchive = draft.archive;

		const toBeArchivedCards:Record<string, string> = {};

		for (const card of lastStack.cards) {
			const cardHash = cardHashes[card.id];
			if (!lastStackAddedDates[draftBoard.noteId] || !lastStackAddedDates[draftBoard.noteId][cardHash]) {
				logger.warn('Could not find card in lastStackAddedDates: ' + draftBoard.noteId + ': ' + cardHash);
				continue;
			}
			const addedDate = lastStackAddedDates[draftBoard.noteId][cardHash];
			if (addedDate < threshold) {
				toBeArchivedCards[card.id] = cardHash;
			}
		}

		for (const [cardId,] of Object.entries(toBeArchivedCards)) {
			const [stackIndex, cardIndex] = findCardIndex(draftBoard, cardId);
			const card = draftBoard.stacks[stackIndex].cards[cardIndex];
			draftBoard.stacks[stackIndex].cards.splice(cardIndex, 1);
			draftArchive.stacks[0].cards.push(card);
		}
	});
}