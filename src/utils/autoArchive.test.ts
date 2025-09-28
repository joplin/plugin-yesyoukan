import { processAutoArchiving, recordLastStackAddedDates } from "./autoArchive";
import { createCard, createCardHash } from "./cards";
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
						...createCard('one'),	
					},
					{
						...createCard('two'),	
					},
				],
			},
		],
	}

	return board;
}

describe('autoArchive', () => {
	
	it('should record the last stack added dates', async () => {
		let lastStackAddedDates:LastStackAddedDates = {};

		const board = createTestBoard();

		const cardHash1 = await createCardHash(board.stacks[0].cards[0]);
		const cardHash2 = await createCardHash(board.stacks[0].cards[1]);

		// -----------------------------------------------------------------------------------------
		// Check that the dates are recorded for all the cards
		// -----------------------------------------------------------------------------------------

		const before = Date.now();
		await msleep(500);
		lastStackAddedDates = await recordLastStackAddedDates(board, lastStackAddedDates);

		expect(lastStackAddedDates['1234'][cardHash1]).toBeGreaterThan(before);
		expect(lastStackAddedDates['1234'][cardHash2]).toBeGreaterThan(before);

		// -----------------------------------------------------------------------------------------
		// Check that, after adding one more card, the date is added for that card, and the previous
		// card dates are not modified
		// -----------------------------------------------------------------------------------------

		let previousValue = lastStackAddedDates;

		board.stacks[0].cards.push(createCard());

		const cardHash3 = await createCardHash(board.stacks[0].cards[2]);

		await msleep(500);
		lastStackAddedDates = await recordLastStackAddedDates(board, lastStackAddedDates);

		expect(lastStackAddedDates['1234'][cardHash1]).toBe(previousValue['1234'][cardHash1]);
		expect(lastStackAddedDates['1234'][cardHash2]).toBe(previousValue['1234'][cardHash2]);
		expect(lastStackAddedDates['1234'][cardHash3]).toBeGreaterThan(lastStackAddedDates['1234'][cardHash1]);

		// -----------------------------------------------------------------------------------------
		// Check that if a card is deleted, its hash is cleared
		// -----------------------------------------------------------------------------------------

		previousValue = lastStackAddedDates;
		board.stacks[0].cards[1].title = 'two - mod';
		lastStackAddedDates = await recordLastStackAddedDates(board, lastStackAddedDates);

		// Check that we still have 3 hashes - previously we would have 4 due to the old hash not
		// being deleted
		expect(Object.keys(lastStackAddedDates['1234']).length).toBe(3);

		// Check that only the hash for card 2 has been changed
		expect(lastStackAddedDates['1234'][cardHash1]).toBe(previousValue['1234'][cardHash1]);
		expect(lastStackAddedDates['1234'][cardHash2]).not.toBe(previousValue['1234'][cardHash2]);
		expect(lastStackAddedDates['1234'][cardHash3]).toBe(previousValue['1234'][cardHash3]);
	});

	it('should clear the recorded dates of previous stacks', async () => {
		let lastStackAddedDates:LastStackAddedDates = {};

		const board = createTestBoard();

		lastStackAddedDates = await recordLastStackAddedDates(board, lastStackAddedDates);

		board.stacks.push({
			id: uuid(),
			cards: [],
			title: 'new last',
		});

		lastStackAddedDates = await recordLastStackAddedDates(board, lastStackAddedDates);

		expect(lastStackAddedDates).toEqual({ '1234': {} });

		const beforeTime = Date.now();
		board.stacks[1].cards.push(createCard());
		const cardHash3 = await createCardHash(board.stacks[1].cards[0]);

		lastStackAddedDates = await recordLastStackAddedDates(board, lastStackAddedDates);

		expect(lastStackAddedDates['1234'][cardHash3]).toBeGreaterThanOrEqual(beforeTime);
	});

	it('should auto-archive cards', async () => {
		const board = createTestBoard();
		const archive = createTestBoard();
		archive.stacks[0].cards = [];
		const lastStackAddedDates = await recordLastStackAddedDates(board, {});

		{
			const result = await processAutoArchiving(board, archive, lastStackAddedDates, 2);

			expect(result.board).toBe(board);
			expect(result.archive).toBe(archive);
		}

		const cardHash1 = await createCardHash(board.stacks[0].cards[0]);

		{
			const newlastStackAddedDates = JSON.parse(JSON.stringify(lastStackAddedDates));
			newlastStackAddedDates['1234'][cardHash1] = Date.now() - 3 * Day;

			const result = await processAutoArchiving(board, archive, newlastStackAddedDates, 2);

			expect(result.board.stacks[0].cards.length).toBe(1);
			expect(await createCardHash(result.archive.stacks[0].cards[0])).toBe(cardHash1);
		}
	});

});