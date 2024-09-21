import { parseNote } from "./noteParser";
import { Board, State } from "./types";

const noteBody1 = `# Draft

## Post 1

Content 1

## Post 2

Content 2

# To review

## Post 3

Content 3

# To publish

## Post 4

Content 4


Some empty lines above

# Completed


`

describe('noteParser', () => {

	test.each<[string, Board]>([
		[
			noteBody1,
			{
				stacks: [
					{
						id: '',
						title: 'Draft',
						cards: [
							{
								id: '',
								title: 'Post 1',
								body: 'Content 1',
							},
							{
								id: '',
								title: 'Post 2',
								body: 'Content 2',
							},
						]
					},

					{
						id: '',
						title: 'To review',
						cards: [
							{
								id: '',
								title: 'Post 3',
								body: 'Content 3',
							},
						]
					},

					{
						id: '',
						title: 'To publish',
						cards: [
							{
								id: '',
								title: 'Post 4',
								body: 'Content 4\n\n\nSome empty lines above',
							},
						]
					},


					{
						id: '',
						title: 'Completed',
						cards: []
					},
				],
			},
		],
	])('should parse a note', (noteBody, board) => {
		const actual = parseNote(noteBody)
		
		actual.stacks = actual.stacks.map(s => {
			s.id = ''
			s.cards = s.cards.map(c => {
				c.id = '';
				return c;
			});
			return s;
		});

		console.info('ACTUAL', JSON.stringify(actual, null, '\t'));
		console.info('EXPECTED', JSON.stringify(board, null, '\t'));

		expect(actual).toEqual(board);
	});

});