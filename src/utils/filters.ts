import { Board, Filters, Stack } from "./types";

export const applyFilters = (board:Board) => {
	const output:Board = {
		stacks: [],
		noteId: board.noteId,
		settings: board.settings,
	}

	const filterTagIds = board.settings.filters?.tagIds || [];
	let totalCardCount = 0;
	let visibleCardCount = 0;

	for (const stack of board.stacks) {
		const currentStack:Stack = {
			...stack,
			cards: [],
		};

		output.stacks.push(currentStack);

		for (const card of stack.cards) {
			totalCardCount++;
			if (filterTagIds.length) {
				const cardTagIds = card.tags ? card.tags.map(t => t.id) : [];
				for (const cardTagId of cardTagIds) {
					if (filterTagIds.includes(cardTagId)) {
						currentStack.cards.push(card);
						visibleCardCount++;
						break;
					}
				}
			} else {
				currentStack.cards.push(card);
				visibleCardCount++;
			}
		}
	}

	return {
		board: output,
		totalCardCount,
		visibleCardCount,
	};
}