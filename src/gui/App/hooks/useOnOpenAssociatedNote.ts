import Logger from "@joplin/utils/Logger";
import { useCallback } from "react";
import { CardHandler } from "../../../gui/CardViewer";
import { findCard } from "../../../utils/board";
import { parseAsNoteLink } from "../../../utils/noteParser";
import { Board, WebviewApi } from "../../../utils/types";

const logger = Logger.create('YesYouKan: useOnOpenAssociatedNote');

interface Props {
	board:Board;
	webviewApi: WebviewApi;
}

export default (props:Props) => {
	const onOpenAssociatedNote = useCallback<CardHandler>(async (event) => {
		const card = findCard(props.board, event.cardId);
		const parsedTitle = parseAsNoteLink(card.title);
		if (!parsedTitle) {
			logger.warn('Card has not associated note:', card);
		} else {
			await props.webviewApi.postMessage({
				type: 'openNote',
				value: parsedTitle.id
			});
		}
	}, [props.board]);

	return onOpenAssociatedNote;
}