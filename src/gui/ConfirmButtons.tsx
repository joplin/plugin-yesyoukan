import * as React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Props {
	onConfirm(): void;
	onCancel(): void;
	showConfirm?: boolean;
	className?: string;
}

export default (props:Props) => {
	const showConfirm = props.showConfirm !== false;

	const classes = ['confirm-buttons'];
	if (props.className) classes.push(props.className);

	return (
		<div className={classes.join(' ')}>
			{ showConfirm && <button title="Ctrl+Enter" onClick={props.onConfirm} className="button -confirm"><FontAwesomeIcon icon={['far', 'check-circle']} /></button> }
			<button title="Escape" onClick={props.onCancel} className="button -cancel"><FontAwesomeIcon icon="times" /></button>
		</div>
	);
}