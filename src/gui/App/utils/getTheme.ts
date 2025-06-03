import { createTheme } from "@mui/material";

let computedStyle_:CSSStyleDeclaration|null = null;
const getCssVariable = (variableName: string) => {
	if (!computedStyle_) computedStyle_ = getComputedStyle(document.documentElement);
	return computedStyle_.getPropertyValue(variableName).trim();
}

const baseOverrideStyle:any = {
	styleOverrides: {
		root: {
			color: getCssVariable('--joplin-color'),
		},
	},
}

const sharedControlStyle:any = {
	styleOverrides: {
		root: {
			backgroundColor: getCssVariable('--joplin-background-color'),
			'& .MuiOutlinedInput-notchedOutline': {
				borderColor: getCssVariable('--joplin-divider-color'),
			},
			'&:hover .MuiOutlinedInput-notchedOutline': {
				borderColor: getCssVariable('--joplin-color'),
			},
			'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
				borderColor: getCssVariable('--joplin-color'),
			},
		},
		paper: {
			backgroundColor: getCssVariable('--joplin-background-color'),
		},
		noOptions: {
			color: getCssVariable('--joplin-color'),
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
		MuiButtonBase: {
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
		MuiAutocomplete: sharedControlStyle,
		MuiSvgIcon: baseOverrideStyle,
		MuiFormLabel: {
			styleOverrides: {
				root: {
					color: getCssVariable('--joplin-color'),
					'&.Mui-focused': {
						color: getCssVariable('--joplin-color'),
					},
					'&.MuiFormLabel-filled': {
						color: getCssVariable('--joplin-color'),
					},
				},
			},
		},
	},
});

export default () => {
	return theme;
}