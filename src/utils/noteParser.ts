import { parseAppSettings, parseCardSettings, SettingType } from "./settings";
import { Board, Card, CardSettings, Settings, Stack, emptyBoard } from "./types";
import uuid from "./uuid";
import Logger from '@joplin/utils/Logger';
const fastDeepEqual = require('fast-deep-equal');

const logger = Logger.create('YesYouKan: noteParser');

const parseSettingLine = (line:string) => {
	const index = line.indexOf(':');
	return [line.substring(0, index), line.substring(index + 1).trim()];
}

export const noteIsBoard = (noteBody:string) => {
	if (!noteBody) return false;
	return noteBody.includes('```kanban-settings');
}

const parseAsNoteLinkRegex = /^\[([^\]]+)\]\(:\/([a-f0-9]{32})\)$/;

export const parseAsNoteLink = (s:string) => {
	const m = s.trim().match(parseAsNoteLinkRegex);
	if (!m) return null;
	return {
		title: m[1],
		id: m[2],
	}
}

export const parseNote = async (noteId:string, noteBody:string) => {
	const lines = noteBody.split('\n').map(l => l.trimEnd());

	const board:Board = emptyBoard();

	board.noteId = noteId;

	let state:'idle'|'inStack'|'inCard'|'inBody'|'inSettings' = 'idle';
	let previousState:string = '';
	let rawSettings:Record<string, string> = {};
	let kanbanRawSettings:Record<string, string> = {};
	let settingBlockType = '';

	let currentStack:Stack = null;
	let currentCard:Card = null;

	for (const line of lines) {
		if (line === '```kanban-settings' || line === '```card-settings') {
			previousState = state;
			state = 'inSettings';
			settingBlockType = line.substring(3);
			rawSettings = {};
		} else if (state === 'inSettings' && line === '```') {
			state = previousState as any;

			if (settingBlockType === 'kanban-settings') {
				kanbanRawSettings = rawSettings;
			} else { // CARD
				currentCard.settings = parseCardSettings(rawSettings, logger);
			}
		} else if (state === 'inSettings') {
			if (line.startsWith('#')) continue;
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

	board.settings = parseAppSettings(kanbanRawSettings, logger);

	return board;
}

const serializeSettings = (type:SettingType, header:string, settings:Settings | CardSettings) => {
	const sortedKeys = Object.keys(settings).sort();

	const output:string[] = [];
	output.push('```' + header);
	if (type === SettingType.App) output.push('# Do not remove this block');
	for (const key of sortedKeys) {
		const value = settings[key];
		let sValue = '';
		if (typeof value === 'boolean') {
			sValue = value === true ? 'true' : 'false';
		} else {
			sValue = value.toString();
		}
		output.push(key + ': ' + sValue);
	}
	output.push('```');

	return output.join('\n');
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

			if (card.settings && Object.keys(card.settings).length) {
				output.push('');
				output.push(serializeSettings(SettingType.Card, 'card-settings', card.settings));
			}

			output.push('');
		}
	}

	output.push(serializeSettings(SettingType.App, 'kanban-settings', board.settings));
	output.push('');

	return output.join('\n');
}

export const boardsEqual = (board1:Board, board2:Board) => {
	if (board1.stacks.length !== board2.stacks.length) return false;
	if (board1.noteId !== board2.noteId) return false;

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
			if (!fastDeepEqual(card1.settings, card2.settings)) return false;
		}
	}

	return true;
}