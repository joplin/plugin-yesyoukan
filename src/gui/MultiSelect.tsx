import * as React from "react";
import { useCallback } from 'react';
import { Autocomplete, TextField, Chip } from "@mui/material";

export interface Option {
	value: string;
	label: string;
}

interface Props {
	label: string;
	options: Option[];
	value: Option[];
	onChange: (value:Option[]) => void;
}

const MultiSelect = (props:Props) => {
	const onChange = useCallback((_event, newValue) => {
		props.onChange(newValue);
	}, [props.onChange]);

	return (
		<Autocomplete
			multiple
			options={props.options}
			getOptionLabel={(option) => option.label}
			value={props.value}
			onChange={onChange}
			isOptionEqualToValue={(option, value) => option.value === value.value}
			renderTags={(value, getTagProps) =>
				value.map((option, index) => (
					<Chip
						key={option.value}
						label={option.label}
						{...getTagProps({ index })}
					/>
				))
			}
			renderInput={(params) => (
				<TextField
					{...params}
					variant="outlined"
					label={props.label}
					placeholder="Choose..."
				/>
			)}
		/>
	);
};

export default MultiSelect;
