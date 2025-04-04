import { createCard } from "./cards";
import { applyFilters } from "./filters";
import { parseNote } from "./noteParser";
import processRenderedCards from "./processRenderedCards";
import { Board, CardToRender } from "./types";

describe('filters', () => {

	it('should filter cards', async () => {
		const board:Board = {
			noteId: '',
			settings: {},
			stacks: [
				{
					id: '1',
					title: '',
					cards: [
						{
							...createCard(),
							id: 'card1',
							tags: [
								{
									id: '1',
									title: 'one',
								},
								{
									id: '2',
									title: 'two',
								},
							],
						},

						{
							...createCard(),
							id: 'card2',
							tags: [],
						},

						{
							...createCard(),
							id: 'card3',
							tags: [
								{
									id: '1',
									title: 'one',
								},
							],
						},
					],
				},
			],
		}

		expect(applyFilters({
			...board,
			settings: {
				filters: {
					tagIds: [],
				}
			}
		}).stacks[0].cards.length).toBe(3);

		expect(applyFilters({
			...board,
			settings: {
				filters: {
					tagIds: ['1'],
				}
			}
		}).stacks[0].cards.map(c => c.id)).toEqual(['card1', 'card3']);

		expect(applyFilters({
			...board,
			settings: {
				filters: {
					tagIds: ['1', '2'],
				}
			}
		}).stacks[0].cards.map(c => c.id)).toEqual(['card1', 'card3']);

		expect(applyFilters({
			...board,
			settings: {
				filters: {
					tagIds: ['2'],
				}
			}
		}).stacks[0].cards.map(c => c.id)).toEqual(['card1']);
	});

});