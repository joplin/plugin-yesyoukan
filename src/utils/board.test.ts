import { getCardTitleAndIndex } from "./board";
import { parseNote, serializeBoard } from "./noteParser";
import { Board } from "./types";

const noteBody1 = `# Draft

## Post 1

Content 1

## Post 2

Content 2

## Post 3

Content 3

# To review

## Post 3

Content 3 again

\`\`\`kanban-settings
# Do not remove this block
confirmKey: Shift+Enter
stackWidth: 100
\`\`\`
`

describe('board', () => {
	
	it('should get the card title and index', async () => {
		const board = await parseNote('abcd', noteBody1);

		{
			const card = board.stacks[0].cards[0];
			expect(getCardTitleAndIndex(board, card.id)).toEqual({ title: 'Post 1', index: 0 });
		}

		{
			const card = board.stacks[0].cards[2];
			expect(getCardTitleAndIndex(board, card.id)).toEqual({ title: 'Post 3', index: 0 });
		}

		{
			const card = board.stacks[1].cards[0];
			expect(getCardTitleAndIndex(board, card.id)).toEqual({ title: 'Post 3', index: 1 });
		}
	});

});