import * as React from 'react';
import { Box } from '@mui/material';
import { useState } from 'react';
import ResetButton from './ResetButton';

interface Props {
	label: string;
	onReset: Function;
	resetDisabled: boolean;
	control: any;	
}

const GenericControl = (props:Props) => {
	const Control = props.control;

	return (
		<Box display="flex" alignItems="center">
			<Box width="30%">
				<label>{props.label}</label>
			</Box>
			<Box width="70%" flexDirection="row">
				<Control />
			</Box>
			<Box width="40px">
				<ResetButton onReset={props.onReset} disabled={props.resetDisabled}/>
			</Box>
		</Box>
	);
}

export default GenericControl;