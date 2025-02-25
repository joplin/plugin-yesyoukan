import * as React from 'react';
import { useState, useEffect,useMemo, useCallback } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { SketchPicker, ColorResult, GithubPicker } from 'react-color';

interface Props {
	colors: string[];
	value: string;
	onChange: (color: string) => void;
}

const ColorPicker = (props:Props) => {
	const componentId = useMemo(() => {
		return 'color-picker-' + (Math.floor(Math.random() * 100000000));
	}, []);

	const onChange = useCallback((color:string) => {
		props.onChange(color);
	}, [props.onChange]);

	useEffect(() => {
		(window as any).Coloris({
			swatchesOnly: true,
			parent: '#' + componentId,
			swatches: props.colors,
			onChange,
		});
	}, [props.colors]);

	const inputStyle = useMemo(() => {
		return {
			backgroundColor: props.value,
		}
	}, [props.value]);

	return (
		<div id={componentId} className="color-picker">
			<input type="text" style={inputStyle} data-coloris defaultValue={props.value} readOnly={true}/>
		</div>
	);
};

export default ColorPicker;
