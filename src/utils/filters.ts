import { Board, Filters, Stack } from "./types";

export const applyFilters = (board:Board) => {
	const output:Board = {
		stacks: [],
		noteId: board.noteId,
		settings: board.settings,
	}

	const filterTagIds = board.settings.filters?.tagIds || [];

	for (const stack of board.stacks) {
		const currentStack:Stack = {
			...stack,
			cards: [],
		};

		output.stacks.push(currentStack);

		for (const card of stack.cards) {
			if (filterTagIds.length) {
				const cardTagIds = card.tags ? card.tags.map(t => t.id) : [];
				for (const cardTagId of cardTagIds) {
					if (filterTagIds.includes(cardTagId)) {
						currentStack.cards.push(card);
						break;
					}
				}
			} else {
				currentStack.cards.push(card);
			}
		}
	}

	return output;
}