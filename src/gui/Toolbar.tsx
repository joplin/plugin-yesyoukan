import { Button as MUIButton, Tooltip } from '@mui/material';
import * as React from 'react';
import Button, { Props as ButtonProps } from './Button';

interface Props {
	buttons: ButtonProps[];
}

export default (props:Props) => {
	const renderButtons = () => {
		const output:React.JSX.Element[] = []
		for (const [index, button] of props.buttons.entries()) {
			output.push(<Button key={'button-' + index} {...button}/>);
		}
		return output;
	}

	return (
		<div className="main-toolbar">
			{renderButtons()}
		</div>
	)
}
