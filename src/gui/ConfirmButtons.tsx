import * as React from "react";

interface Props {
	onConfirm(): void;
	onCancel(): void;
}

export default (props:Props) => {
	return (
		<div className="confirm-buttons">
			<button title="Ctrl+Enter" onClick={props.onConfirm} className="button -confirm"><i className="far fa-check-circle"></i></button>
			<button title="Escape" onClick={props.onCancel} className="button -cancel"><i className="fas fa-times"></i></button>
		</div>
	);
}