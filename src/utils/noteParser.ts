import { parseSettings } from "./settings";
import { Board, Card, Stack, emptyBoard } from "./types";
import uuid from "./uuid";

const parseSettingLine = (line:string) => {
	const index = line.indexOf(':');
	return [line.substring(0, index), line.substring(index + 1).trim()];
}

export const parseNote = async (noteBody:string) => {
	const lines = noteBody.split('\n').map(l => l.trim());

	const board:Board = emptyBoard();

	let state:'idle'|'inStack'|'inCard'|'inBody'|'inSettings' = 'idle';
	let previousState:string = '';
	const rawSettings:Record<string, string> = {};

	let currentStack:Stack = null;
	let currentCard:Card = null;

	for (const line of lines) {
		if (line === '```kanban-settings') {
			previousState = state;
			state = 'inSettings';
		} else if (state === 'inSettings' && line === '```') {
			state = previousState as any;
		} else if (state === 'inSettings') {
			const [key, value] = parseSettingLine(line);
			rawSettings[key] = value;
		} else if (line.startsWith('# ')) {
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
		} else if (state === 'inBody') {
			if (currentCard.body) currentCard.body += '\n';
			currentCard.body += line;
		}
	}

	for (const stack of board.stacks) {
		for (const card of stack.cards) {
			card.body = card.body.trim();
		}
	}

	board.settings = parseSettings(rawSettings, console);
	
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

	const sortedKeys = Object.keys(board.settings).sort();

	output.push('```kanban-settings');
	for (const key of sortedKeys) {
		const value = board.settings[key];
		let sValue = '';
		if (typeof value === 'boolean') {
			sValue = value === true ? 'true' : 'false';
		} else {
			sValue = value.toString();
		}
		output.push(key + ': ' + sValue);
	}
	output.push('```');
	output.push('');

	return output.join('\n');
}

export const boardsEqual = (board1:Board, board2:Board) => {
	if (board1.stacks.length !== board2.stacks.length) return false;

	const settingKeys = Object.keys(board1.settings).sort();
	if (settingKeys.length !== Object.keys(board2.settings).length) return false;

	for (const key of settingKeys) {
		if (board1.settings[key] !== board2.settings[key]) return false;
	}

	for (const [index, stack1] of board1.stacks.entries()) {
		const stack2 = board2.stacks[index];

		if (stack1.title !== stack2.title) return false;
		if (stack1.cards.length !== stack2.cards.length) return false;

		for (const [cardIndex, card1] of stack1.cards.entries()) {
			const card2 = stack2.cards[cardIndex];

			if (card1.title !== card2.title) return false;
			if (card1.body !== card2.body) return false;
		}
	}

	return true;
}