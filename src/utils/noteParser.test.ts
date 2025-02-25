import { parseNote, serializeBoard } from "./noteParser";
import { Board } from "./types";

const noteBody1 = `# Draft

## Post 1

Content 1

## Post 2

Content 2

# To review

## Post 3

Content 3

\`\`\`card-settings
backgroundColor: #ff0000
\`\`\`

# To publish

## Post 4

Content 4


Some empty lines above

# Completed

\`\`\`kanban-settings
# Do not remove this block
confirmKey: Shift+Enter
stackWidth: 100
\`\`\`
`

describe('noteParser', () => {

	test.each<[string, Board]>([
		[
			noteBody1,
			{
				noteId: '',
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
								settings: {
									backgroundColor: '#ff0000',
								},
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
				settings: {
					stackWidth: 100,
					confirmKey: 'Shift+Enter',
				}
			},
		],
	])('should parse a note', async (noteBody, board) => {
		const actual = await parseNote('', noteBody)
		
		actual.stacks = actual.stacks.map(s => {
			s.id = ''
			s.cards = s.cards.map(c => {
				c.id = '';
				return c;
			});
			return s;
		});

		expect(actual).toEqual(board);

		{
			const actual = serializeBoard(board);
			expect(actual).toBe(noteBody);
		}
	});

});