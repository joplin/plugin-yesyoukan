import { Button as MUIButton, Tooltip } from '@mui/material';
import * as React from 'react';

interface ButtonClickEvent {
	name: string;
}

type ButtonClickEventHandler = (event:ButtonClickEvent) => void;

export interface ButtonProps {
	name: string;
	icon: string;
	onClick: ButtonClickEventHandler;
	enabled: boolean;
	title: string;
}

interface Props {
	buttons: ButtonProps[];
}

const Button = (props:ButtonProps) => {
	return (
		<Tooltip title={props.title}>
			<MUIButton disabled={!props.enabled} onClick={props.onClick as any} sx={{ width: 26, height: 26, minWidth: 26, maxWidth: 26, minHeight: 26, maxHeight: 26 }} >
				<i className={props.icon}></i>
			</MUIButton>
		</Tooltip>
	);
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
