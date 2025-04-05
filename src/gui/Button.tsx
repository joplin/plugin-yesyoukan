import * as React from 'react';
import { Button as MUIButton, Tooltip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface Props {
	name?: string;
	icon: IconProp;
	onClick: React.MouseEventHandler;
	disabled?: boolean;
	title?: string;
	label?: string;
}

export default (props: Props) => {
	const renderButton = () => {
		const isIconOnly = !props.label;

		return (
			<MUIButton
				disabled={!!props.disabled}
				onClick={props.onClick}
				sx={
					isIconOnly
						? {
							width: 26,
							height: 26,
							minWidth: 26,
							maxWidth: 26,
							minHeight: 26,
							maxHeight: 26,
						}
						: {
							px: 1.5,
							minHeight: 26,
							height: 26,
						}
				}
			>
				<FontAwesomeIcon icon={props.icon} style={{ marginRight: props.label ? 6 : 0 }} />
				{props.label && <span style={{ textTransform: 'lowercase' }}>{props.label}</span>}
			</MUIButton>
		);
	};

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
