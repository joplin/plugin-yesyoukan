import Logger from "@joplin/utils/Logger";
import { CardToRender, Note, RenderedCard, RenderResult } from "./types";

const logger = Logger.create('YesYouCan: processRenderedCards');

export const cardIdPlaceHolder = 'YESYOUCANCARDIDTHATNEEDSTOBECHANGED';
export const titleBodyDivider = 'YESYOUKANTITLEBODYMARKER';
export const cardDivider = 'YESYOUKANCARDDIVIDER';

const cardIdRegex = new RegExp(cardIdPlaceHolder, 'g');
const checkboxRegex = new RegExp('checkboxclick:(unchecked|checked):([0-9]+)', 'g');

export default async (
	cardsToRender:Record<string, CardToRender>,
	fetchNote:(noteId:string) => Promise<Note>,
	renderMarkup:(markup:string, options:any) => Promise<RenderResult>,
) => {
	// For performance reasons, we concatenated the body of all the notes into one big document, and
	// then send this to `renderMarkup`.
	//
	// It means that afterwards we need to fix up the document, in particular the checkboxes. The
	// checkbox handlers are based on line number, which is going to be wrong if all the cards are
	// concatenated.
	const bigDoc:string[] = [];
	const cardIdToNotes:Record<string, Note|null> = {};
	const cardLineIndexes:Record<string, number> = {};
	let currentCardLineIndex = 0;

	for (const [cardId, cardToRender] of Object.entries(cardsToRender)) {
		let titleToRender = '';
		let bodyToRender = '';
		cardIdToNotes[cardId] = null;

		if (cardToRender.source === "note") {
			let note:Note =  null;
			try {
				note = await fetchNote(cardToRender.noteId);
				cardIdToNotes[cardId] = note;
			} catch (error) {
				logger.warn('Could not find note associated with card:', cardToRender, error);

				note = {
					id: cardToRender.noteId,
					title: cardToRender.cardTitle || '',
					body: '',
					is_todo: 0,
					todo_completed: 0,
					todo_due: 0,
					deleted_time: 0,
				}
			}

			titleToRender = note.title;
			bodyToRender = note.body.trim();
		} else { // source = card
			titleToRender = cardToRender.cardTitle;
			bodyToRender = cardToRender.cardBody.trim();
		}

		if (bigDoc.length) bigDoc.push(cardDivider);
		
		bigDoc.push(titleToRender);
		bigDoc.push(titleBodyDivider);
		bigDoc.push(bodyToRender);

		// Title Card 1
		//
		// YESYOUKANTITLEBODYMARKER
		// 
		// Line 1
		// Line 2
		//
		// YESYOUKANCARDDIVIDER
		//
		// Title Card 2
		//
		//

		cardLineIndexes[cardId] = currentCardLineIndex;

		currentCardLineIndex += 7 + bodyToRender.split('\n').length;
	}

	const bigDocResult:RenderResult = await renderMarkup(
		bigDoc.join('\n\n'),
		{
			postMessageSyntax: 'cardPostMessage("' + cardIdPlaceHolder + '")'
		}
	);

	let bigDocHtml = bigDocResult.html
	bigDocHtml = bigDocHtml.replace(/^<div.*?>/, '');
	bigDocHtml = bigDocHtml.replace(/<\/div>$/, '');

	const bigDocSplitted = bigDocHtml.split('<p>' + cardDivider + '</p>');
	const rendered:Record<string, RenderedCard> = {};

	let cardIndex:number = 0;
	for (const [cardId, ] of Object.entries(cardsToRender)) {
		const doc = bigDocSplitted[cardIndex];
		let [titleHtml, bodyHtml] = doc.split('<p>' + titleBodyDivider + '</p>').map(s => s.trim());
		const cardLineIndex = cardLineIndexes[cardId];
		const bodyLineIndex = cardLineIndex + 4;

		bodyHtml = bodyHtml.replace(cardIdRegex, cardId);

		bodyHtml = bodyHtml.replace(checkboxRegex, (_s:string, checkedStatus:string, lineNumber:string) => {
			return `checkboxclick:${checkedStatus}:${Number(lineNumber) - bodyLineIndex}`;
		});

		const note = cardIdToNotes[cardId];

		rendered[cardId] = {
			title: { html: titleHtml, cssStrings: bigDocResult.cssStrings, pluginAssets: bigDocResult.pluginAssets },
			body: { html: bodyHtml, cssStrings: bigDocResult.cssStrings, pluginAssets: bigDocResult.pluginAssets },
			noteExists: !!note,
			todo_due: note ? note.todo_due : 0,
			todo_completed:  note ? note.todo_completed : 0,
			is_todo: note ? note.is_todo : 0,
			deleted_time: note ? note.deleted_time : 0,
		}
		
		cardIndex++;
	}

	return rendered;
}