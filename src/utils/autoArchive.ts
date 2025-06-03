import { Board, LastStackAddedDates } from "./types"
import { Day } from "./time";
import { produce } from "immer";
import { findCardIndex } from "./board";
import Logger from "@joplin/utils/Logger";

const logger = Logger.create('autoArchive');

export const recordLastStackAddedDates = (board: Board, lastStackAddedDates:LastStackAddedDates) => {
	return produce(lastStackAddedDates, draft => {
		for (let stackIndex = 0; stackIndex < board.stacks.length; stackIndex++) {
			const stack = board.stacks[stackIndex];
			const isLastStack = stackIndex === board.stacks.length - 1;

			for (const card of stack.cards) {
				if (!draft[board.noteId]) draft[board.noteId] = {};

				if (isLastStack) {
					if (!draft[board.noteId][card.id]) {
						draft[board.noteId][card.id] = Date.now();
					}
				} else {
					// If it's not the last stack, we remove all the cards from the object - this
					// handles the case where a new stack is appended to the board. In which case,
					// we no longer want to archive the cards that were in the previous "last
					// stack".
					delete draft[board.noteId][card.id];
				}
			}
		}
	});
}

export const processAutoArchiving = (board: Board, archive:Board, lastStackAddedDates:LastStackAddedDates, autoArchiveDelayDays:number) => {
	if (!board.stacks.length) return { board, archive };

	const lastStack = board.stacks[board.stacks.length - 1];
	const threshold = Date.now() - autoArchiveDelayDays * Day;

	return produce({ board, archive }, draft => {
		const draftBoard = draft.board;
		const draftArchive = draft.archive;

		const toBeArchivedCards:string[] = [];

		for (const card of lastStack.cards) {
			if (!lastStackAddedDates[draftBoard.noteId] || !lastStackAddedDates[draftBoard.noteId][card.id]) {
				logger.warn('Could not find card in lastStackAddedDates: ' + draftBoard.noteId + ': ' + card.id);
				continue;
			}
			const addedDate = lastStackAddedDates[draftBoard.noteId][card.id];
			if (addedDate < threshold) {
				toBeArchivedCards.push(card.id);
			}
		}

		for (const cardId of toBeArchivedCards) {
			const [stackIndex, cardIndex] = findCardIndex(draftBoard, cardId);
			const card = draftBoard.stacks[stackIndex].cards[cardIndex];
			draftBoard.stacks[stackIndex].cards.splice(cardIndex, 1);
			draftArchive.stacks[0].cards.push(card);
		}
	});
}