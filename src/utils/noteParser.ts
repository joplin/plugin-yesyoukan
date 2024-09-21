import { Board, Card, Stack } from "./types";
import uuid from "./uuid";

export const parseNote = (noteBody:string) => {
	const lines = noteBody.split('\n').map(l => l.trim());

	const board:Board = {
		stacks: [],
	};

	let state:'idle'|'inStack'|'inCard'|'inBody' = 'idle';

	let currentStack:Stack = null;
	let currentCard:Card = null;

	for (const line of lines) {
		if (line.startsWith('# ')) {
			state = 'inStack';

			currentStack = {
				id: uuid(),
				title: line.substring(2),
				cards: [],
			}

			board.stacks.push(currentStack);
		} else if (line.startsWith('## ')) {
			state = 'inCard';

			currentCard = {
				id: uuid(),
				title: line.substring(3),
				body: '',
			};

			currentStack.cards.push(currentCard);
		} else if (!!line && state === 'inCard') {
			state = 'inBody';

			if (currentCard.body) currentCard.body += '\n';
			currentCard.body += line;
			currentCard.body = currentCard.body.trim();
		} else if (state === 'inBody') {
			if (currentCard.body) currentCard.body += '\n';
			currentCard.body += line;
			currentCard.body = currentCard.body.trim();
		}
	}

	return board;
}

export const serializeBoard = (board:Board) => {
	const output:string[] = [];

	for (const stack of board.stacks) {
		output.push('# ' + stack.title);
		output.push('');

		for (const card of stack.cards) {
			output.push('## ' + card.title);
			output.push('');
			output.push(card.body);
			output.push('');
		}
	}

	return output.join('\n');
}