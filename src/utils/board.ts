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