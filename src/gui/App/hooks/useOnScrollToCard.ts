import { useCallback } from "react";
import { CardHandler } from "../../../gui/CardViewer";
import { getCardTitleAndIndex } from "../../../utils/board";
import { Board, WebviewApi } from "../../../utils/types";

interface Props {
	board:Board;
	webviewApi: WebviewApi;
}

export default (props:Props) => {
	const onScrollToCard = useCallback<CardHandler>((event) => {
		const { title, index } = getCardTitleAndIndex(props.board, event.cardId);
		void props.webviewApi.postMessage<string>({ type: 'scrollToCard', value: {
			cardTitle: title,
			cardIndex: index,
		}});
	}, [props.board]);

	return onScrollToCard;
}