import * as React from 'react';
import { produce } from "immer";
import { useMemo, useState } from "react";
import { getCardNoteIds, getCardTags } from "../../../utils/board";
import { Board } from "../../../utils/types"

interface Props {
	board: Board;
}

export default (props:Props) => {
	return useMemo(() => {
		return getCardTags(props.board);
	}, [props.board]);
}