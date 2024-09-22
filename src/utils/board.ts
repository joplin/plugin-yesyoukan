import { Board } from "./types";

export const findCardIndex = (board:Board, cardId:string) => {
	for (const [stackIndex, stack] of board.stacks.entries()) {
		for (const [cardIndex, card] of stack.cards.entries()) {
			if (card.id === cardId) return [stackIndex, cardIndex];
		}
	}

	throw new Error('Could not find stack for card: ' + cardId);
}