const note1 = `# Draft

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

# Completed


`

describe('noteParser', () => {

	test.each([
		[
			note1,
			{
				board: [
					{
						title: 'Draft',
						cards: [
							{
								title: 'Post 1',
								content: 'Content 1',
							},
							{
								title: 'Post 2',
								content: 'Content 2',
							},
						]
					},

					{
						title: 'To review',
						cards: [
							{
								title: 'Post 3',
								content: 'Content 3',
							},
						]
					},

					{
						title: 'To publish',
						cards: [
							{
								title: 'Post 4',
								content: 'Content 4',
							},
						]
					},


					{
						title: 'Completed',
						cards: []
					},
				],
			},
		],
	])('should parse a note', () => {
		
	});

});