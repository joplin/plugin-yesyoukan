import * as React from "react";
import { useCallback } from "react";
import { ConfirmKey } from "src/utils/types";

interface Props {
	onEditorSubmit():void;
	onEditorCancel():void;
	confirmKey: ConfirmKey;
	tabKeyEnabled: boolean;
}

enum Action {
	Newline,
	Confirm,
	Cancel,
}

const keyToAction = (event:React.KeyboardEvent<unknown>, confirmKey:ConfirmKey):Action => {
	if (event.key === 'Escape') return Action.Cancel;

	const handlers:Record<ConfirmKey, Function> = {
		"Shift+Enter": () => {
			if (event.shiftKey && event.key === 'Enter') return Action.Confirm;
			if (event.key === 'Enter') return Action.Newline;
		},

		"Enter": () => {
			if (event.shiftKey && event.key === 'Enter') return Action.Newline;
			if (event.key === 'Enter') return Action.Confirm;
		},
	};

	return handlers[confirmKey]();
}

export default (props:Props) => {
	return useCallback<React.KeyboardEventHandler<unknown>>((event) => {
		const action = keyToAction(event, props.confirmKey);

		if (action === Action.Newline) {
			// Just enter a newline
		} else if (action === Action.Confirm) {
			event.preventDefault()
			props.onEditorSubmit();
		} else if (action === Action.Cancel) {
			event.preventDefault()
			props.onEditorCancel();
		} else if (event.key === 'Tab' && props.tabKeyEnabled) {
			event.preventDefault();
			const textarea = event.currentTarget as HTMLTextAreaElement;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + "\t" + textarea.value.substring(end);
			textarea.selectionStart = textarea.selectionEnd = start + 1;
		}
	}, [props.onEditorSubmit, props.onEditorCancel]);
}