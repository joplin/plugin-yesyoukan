import { Button as MUIButton, Tooltip } from '@mui/material';
import * as React from 'react';
import Button, { Props as ButtonProps } from './Button';

interface Props {
	buttons: ButtonProps[];
}

export default (props:Props) => {
	const renderButtons = () => {
		const output:React.JSX.Element[] = []
		for (const button of props.buttons) {
			output.push(<Button {...button}/>);
		}
		return output;
	}

	return (
		<div className="main-toolbar">
			{renderButtons()}
		</div>
	)
}
