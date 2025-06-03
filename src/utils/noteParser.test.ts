import { parseNote, serializeBoard } from "./noteParser";
import { Board, Card } from "./types";

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

\`\`\`stack-settings
backgroundColor: #00ff00
\`\`\`

## Post 4

Content 4


Some empty lines above

# Completed

\`\`\`kanban-settings
# Do not remove this block
confirmKey: Shift+Enter
filters: {"tagIds":["1"]}
stackWidth: 100
\`\`\`
`

const getDefaultCard = ():Card => {
	return {
		id: '',
		is_todo: 0,
		title: '',
		todo_completed: 0,
		todo_due: 0,
	}
}

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
								...getDefaultCard(),
								id: '',
								title: 'Post 1',
								body: 'Content 1',
							},
							{
								...getDefaultCard(),
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
								...getDefaultCard(),
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
						settings: {
							backgroundColor: '#00ff00',
						},
						cards: [
							{
								...getDefaultCard(),
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
					filters: { tagIds: ["1"] },
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