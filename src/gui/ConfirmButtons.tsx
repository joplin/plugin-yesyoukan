import * as React from "react";

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
			{ showConfirm && <button title="Ctrl+Enter" onClick={props.onConfirm} className="button -confirm"><i className="far fa-check-circle"></i></button> }
			<button title="Escape" onClick={props.onCancel} className="button -cancel"><i className="fas fa-times"></i></button>
		</div>
	);
}