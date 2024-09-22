import * as React from "react";
import { useCallback } from "react";

interface Props {
	onEditorSubmit():void;
	onEditorCancel():void;
}

export default (props:Props) => {
	return useCallback<React.KeyboardEventHandler<unknown>>((event) => {
		if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
			event.preventDefault()
			props.onEditorSubmit();
		} else if (event.key === 'Escape') {
			event.preventDefault()
			props.onEditorCancel();
		}
	}, [props.onEditorSubmit, props.onEditorCancel]);
}