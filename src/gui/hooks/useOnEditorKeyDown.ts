import * as React from "react";
import { useCallback } from "react";
import { ConfirmKey, NewlineKey, ValidationKey } from "src/utils/types";

interface Props {
	onEditorSubmit():void;
	onEditorCancel():void;
	confirmKey: ConfirmKey;
	newlineKey: NewlineKey;
	tabKeyEnabled: boolean;
}

enum Action {
	Newline,
	Confirm,
	Cancel,
}

const keyToValidationKey = (event:React.KeyboardEvent<unknown>):ValidationKey|null => {
	if (event.shiftKey && event.key === 'Enter') return "Shift+Enter";
	if (event.ctrlKey && event.key === 'Enter') return "Ctrl+Enter";
	if (event.metaKey && event.key === 'Enter') return "Cmd+Enter";
	if (event.key === 'Enter') return 'Enter';
	return null;
}

const keyToAction = (event:React.KeyboardEvent<unknown>, confirmKey:ConfirmKey, newlineKey:NewlineKey):Action => {
	if (event.key === 'Escape') return Action.Cancel;

	const validationKey = keyToValidationKey(event);

	if (confirmKey === validationKey) return Action.Confirm;
	if (newlineKey === validationKey) return Action.Newline;

	return null;
}

export default (props:Props) => {
	return useCallback<React.KeyboardEventHandler<unknown>>((event) => {
		const action = keyToAction(event, props.confirmKey, props.newlineKey);

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