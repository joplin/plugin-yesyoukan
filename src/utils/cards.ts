import { createChecksum } from "./crypto";
import { Card, Stack } from "./types";
import uuid from "./uuid";
import { PromisePool } from '@supercharge/promise-pool'

export const createCard =  (title:string = null, body:string = null) => {
	if (title === null) title = '';
	if (body === null) body = '';

	const card:Card = {
		id: uuid(),
		title,
		body,
		is_todo: 0,
		todo_completed: 0,
		todo_due: 0,
	}

	return card;
}

export const duplicateCard = (card:Card) => {
	const newCard = JSON.parse(JSON.stringify(card)) as Card;
	newCard.id = uuid();
	newCard.title = newCard.title + ' - Copy';
	return newCard;
}

export const createCardHash = async (card:Card) => {
	return createChecksum([
		card.title,
		card.body,
	].join('-'));
}

export const createCardHashes = async (stacks:Stack[]) => {
	const cardHashes:Record<string, string> = {};
	const cards:Card[] = [];

	for (const stack of stacks) {
		for (const card of stack.cards) {
			cards.push(card);
		}
	}

	await PromisePool
		.for(cards)
		.withConcurrency(20)
		.process(async (card) => {
			cardHashes[card.id] = await createCardHash(card);
		});

	return cardHashes;
}
