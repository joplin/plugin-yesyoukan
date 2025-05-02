import { processAutoArchiving, recordLastStackAddedDates } from "./autoArchive";
import { getCardTitleAndIndex } from "./board";
import { createCard } from "./cards";
import { parseNote, serializeBoard } from "./noteParser";
import { Day, msleep } from "./time";
import { Board, LastStackAddedDates } from "./types";
import uuid from "./uuid";

const createTestBoard = () => {
	const board:Board = {
		noteId: '1234',
		settings: {},
		stacks: [
			{
				id: uuid(),
				title: '',
				cards: [
					{
						...createCard(),	
					},
					{
						...createCard(),	
					},
				],
			},
		],
	}

	return board;
}

describe('autoArchive', () => {
	
	it('should record the last stack added dates', async () => {
		const lastStackAddedDates:LastStackAddedDates = {};

		const board = createTestBoard();

		const cardId1 = board.stacks[0].cards[0].id;
		const cardId2 = board.stacks[0].cards[1].id;

		// -----------------------------------------------------------------------------------------
		// Check that the dates are recorded for all the cards
		// -----------------------------------------------------------------------------------------

		const before = Date.now();
		await msleep(10);
		const result = recordLastStackAddedDates(board, lastStackAddedDates);

		expect(result['1234'][cardId1]).toBeGreaterThan(before);
		expect(result['1234'][cardId2]).toBeGreaterThan(before);

		// -----------------------------------------------------------------------------------------
		// Check that, after adding one more card, the date is added for that card, and the previous
		// card dates are not modified
		// -----------------------------------------------------------------------------------------

		const previousValue = result;

		board.stacks[0].cards.push(createCard());

		const cardId3 = board.stacks[0].cards[2].id;

		const newResult = recordLastStackAddedDates(board, result);
		await msleep(10);

		expect(newResult['1234'][cardId1]).toBe(previousValue['1234'][cardId1]);
		expect(newResult['1234'][cardId2]).toBe(previousValue['1234'][cardId2]);
		expect(newResult['1234'][cardId3]).toBeGreaterThan(newResult['1234'][cardId1]);
	});

	it('should clear the recorded dates of previous stacks', async () => {
		let lastStackAddedDates:LastStackAddedDates = {};

		const board = createTestBoard();

		lastStackAddedDates = recordLastStackAddedDates(board, lastStackAddedDates);

		board.stacks.push({
			id: uuid(),
			cards: [],
			title: 'new last',
		});

		lastStackAddedDates = recordLastStackAddedDates(board, lastStackAddedDates);

		expect(lastStackAddedDates).toEqual({ '1234': {} });

		const beforeTime = Date.now();
		board.stacks[1].cards.push(createCard());
		const cardId3 = board.stacks[1].cards[0].id;

		lastStackAddedDates = recordLastStackAddedDates(board, lastStackAddedDates);

		expect(lastStackAddedDates['1234'][cardId3]).toBeGreaterThanOrEqual(beforeTime);
	});

	it('should auto-archive cards', async () => {
		const board = createTestBoard();
		const archive = createTestBoard();
		archive.stacks[0].cards = [];
		const lastStackAddedDates = recordLastStackAddedDates(board, {});

		{
			const result = processAutoArchiving(board, archive, lastStackAddedDates, 2);

			expect(result.board).toBe(board);
			expect(result.archive).toBe(archive);
		}

		const cardId1 = board.stacks[0].cards[0].id;

		{
			const newlastStackAddedDates = JSON.parse(JSON.stringify(lastStackAddedDates));
			newlastStackAddedDates['1234'][cardId1] = Date.now() - 3 * Day;

			const result = processAutoArchiving(board, archive, newlastStackAddedDates, 2);

			expect(result.board.stacks[0].cards.length).toBe(1);
			expect(result.archive.stacks[0].cards[0].id).toBe(cardId1);
		}
	});

});