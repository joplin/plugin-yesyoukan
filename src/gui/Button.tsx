import * as React from 'react';
import { Button as MUIButton, Tooltip } from '@mui/material';

export interface Props {
	name?: string;
	icon: string;
	onClick: React.MouseEventHandler;
	disabled?: boolean;
	title?: string;
}

export default (props:Props) => {
	const renderButton = () => {
		return (
			<MUIButton disabled={!!props.disabled} onClick={props.onClick} sx={{ width: 26, height: 26, minWidth: 26, maxWidth: 26, minHeight: 26, maxHeight: 26 }} >
				<i className={props.icon}></i>
			</MUIButton>
		);
	}

	if (!props.disabled) {
		return (
			<Tooltip hidden={!props.title} title={props.title}>
				{renderButton()}
			</Tooltip>
		);
	} else {
		return renderButton();
	}
}
