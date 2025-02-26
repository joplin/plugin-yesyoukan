import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, IconButton } from '@mui/material';
import { useState } from 'react';

interface Props {
	onReset:any;
	disabled: boolean;
}

const ResetButton = (props:Props) => {
	return (
		<IconButton className='reset-button' onClick={props.onReset} disabled={props.disabled} style={{ marginLeft: '8px' }}>
			<FontAwesomeIcon icon="arrow-rotate-left" size='sm' />
		</IconButton>
	);
};

export default ResetButton;