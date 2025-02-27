import { parseAsNoteLink } from "./noteParser";
import { Board } from "./types";

export const findCardIndex = (board:Board, cardId:string) => {
	for (const [stackIndex, stack] of board.stacks.entries()) {
		for (const [cardIndex, card] of stack.cards.entries()) {
			if (card.id === cardId) return [stackIndex, cardIndex];
		}
	}

	throw new Error('Could not find stack for card: ' + cardId);
}

export const findStackIndex = (board:Board, stackId:string) => {
	const index = board.stacks.findIndex(s => s.id === stackId);
	if (index < 0) throw new Error('Could not find stack: ' + stackId);
	return index;
}

export const findCard = (board:Board, cardId:string) => {
	const [stackIndex, cardIndex] = findCardIndex(board, cardId);
	return board.stacks[stackIndex].cards[cardIndex];
}

export const findStack = (board:Board, stackId:string) => {
	const stackIndex = findStackIndex(board, stackId);
	return board.stacks[stackIndex];
}

export const getCardTitleAndIndex = (board:Board, cardId:string) => {
	const [stackIndex, cardIndex] = findCardIndex(board, cardId);
	const card = board.stacks[stackIndex].cards[cardIndex];
	let cardWithTitleIndex = 0;
	for (let si = 0; si <= stackIndex; si++) {
		const stack = board.stacks[si];
		for (let ci = 0; ci < stack.cards.length; ci++) {
			const c = board.stacks[si].cards[ci];
			if (stackIndex === si && cardIndex === ci) break;

			if (c.title === card.title) cardWithTitleIndex++;
		}
	}

	return {
		title: card.title,
		index: cardWithTitleIndex,
	}
}

export const getCardNotes = (board:Board) => {
	const output:Record<string, string> = {};
	for (const [, stack] of board.stacks.entries()) {
		for (const [, card] of stack.cards.entries()) {
			const noteLink = parseAsNoteLink(card.title);
			if (noteLink) {
				output[card.id] = noteLink.id;
			}
		}
	}
	return output;
}