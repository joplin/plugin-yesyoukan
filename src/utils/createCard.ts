import { Card } from "./types";
import uuid from "./uuid";

export default (title:string = null, body:string = null) => {
	if (title === null) title = 'New card';
	if (body === null) body = '';

	const card:Card = {
		id: uuid(),
		title,
		body,
	}

	return card;
}