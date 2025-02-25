import * as React from 'react';
import { useEffect,useMemo, useCallback } from 'react';
import { colorIdToValue, Colors, colorValueToId, getColorValues } from '../utils/colors';

interface Props {
	colors: Colors;
	value: number;
	onChange: (color: number) => void;
	isDarkMode: boolean;
}

const ColorPicker = (props:Props) => {
	const componentId = useMemo(() => {
		return 'color-picker-' + (Math.floor(Math.random() * 100000000));
	}, []);

	const colorValue = colorIdToValue(props.colors, props.value)

	const onChange = useCallback((color:string) => {
		props.onChange(colorValueToId(props.colors, color));
	}, [props.onChange]);

	useEffect(() => {
		(window as any).Coloris({
			swatchesOnly: true,
			parent: '#' + componentId,
			swatches: getColorValues(props.colors),
			themeMode: props.isDarkMode ? 'dark' : 'light',
			onChange,
		});
	}, [props.colors, props.isDarkMode]);

	const inputStyle = useMemo(() => {
		return {
			backgroundColor: colorValue,
		}
	}, [colorValue]);

	return (
		<div id={componentId} className="color-picker">
			<input
				type="text"
				style={inputStyle}
				data-coloris 
				defaultValue={colorValue}
				readOnly={true}
			/>
		</div>
	);
};

export default ColorPicker;
