import { createTheme } from "@mui/material";

let computedStyle_:CSSStyleDeclaration|null = null;
const getCssVariable = (variableName: string) => {
	if (!computedStyle_) computedStyle_ = getComputedStyle(document.documentElement);
	return computedStyle_.getPropertyValue(variableName).trim();
}

const sharedControlStyle:any = {
	styleOverrides: {
		root: {
			'& .MuiOutlinedInput-notchedOutline': {
				borderColor: getCssVariable('--joplin-divider-color'), // Set default border color
			},
			'&:hover .MuiOutlinedInput-notchedOutline': {
				borderColor: getCssVariable('--joplin-color'), // Set hover color
			},
			'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
				borderColor: getCssVariable('--joplin-color'), // Set focused color
			},
		},
	},
};

const theme = createTheme({
	palette: {
		background: {
			default: getCssVariable('--joplin-background-color'),
		},
		primary: {
			main: getCssVariable('--joplin-color'), 
		},
		text: {
			primary: getCssVariable('--joplin-color'), 
		},
		divider: getCssVariable('--joplin-divider-color'),
	},

	components: {
		MuiMenuItem: {
			styleOverrides: {
				root: {
					color: getCssVariable('--joplin-color'),
					'&:hover': {
						backgroundColor: getCssVariable('--joplin-selected-color'),
						color: getCssVariable('--joplin-color'),
					},
				},
			},
		},
		MuiPopover: {
			styleOverrides: {
				paper: {
					backgroundColor: getCssVariable('--joplin-background-color'),
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					color: getCssVariable('--joplin-color'),
					'&.Mui-disabled': {
						color: getCssVariable('--joplin-color'),
						opacity: 0.4,
					},
				},
			},
		},
		MuiDialog: {
			styleOverrides: {
				paper: {
					backgroundColor: getCssVariable('--joplin-background-color'),
					color: getCssVariable('--joplin-color'),
				},
			},
		},
		MuiDialogContent: {
			styleOverrides: {
				root: {
					backgroundColor: getCssVariable('--joplin-background-color'),
					paddingTop: '10px !important',
				},
			},
		},
		MuiOutlinedInput: sharedControlStyle,
		MuiTextField: sharedControlStyle,
		MuiSelect: sharedControlStyle,
		MuiInputBase: sharedControlStyle,
		MuiFormLabel: {
			styleOverrides: {
				root: {
					color: getCssVariable('--joplin-color'), // Set default label color
					'&.Mui-focused': {
						color: getCssVariable('--joplin-color'), // Set color when focused
					},
					'&.MuiFormLabel-filled': {
						color: getCssVariable('--joplin-color'), // Set color when filled
					},
				},
			},
		},
	},
});

export default () => {
	return theme;
}