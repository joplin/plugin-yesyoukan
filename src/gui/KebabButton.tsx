import * as React from "react";
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ThemeProvider, createTheme, CssBaseline, Divider } from '@mui/material';

interface Props {

}

let computedStyle_:CSSStyleDeclaration|null = null;
const getCssVariable = (variableName: string) => {
	if (!computedStyle_) computedStyle_ = getComputedStyle(document.documentElement);
	return computedStyle_.getPropertyValue(variableName).trim();
}

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
		divider: getCssVariable('--joplin-divider-color') ,
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
	  },
});  

export default (props:Props) => {
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	
	const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<ThemeProvider theme={theme}>
			<div>
				<button onClick={onClick} className="kebab-button">
					<i className="fas fa-ellipsis-v"></i>
				</button>
				<Menu
					className="context-menu"
					anchorEl={anchorEl}
					open={open}
					onClose={handleClose}
					MenuListProps={{
						'aria-labelledby': 'basic-button',
					}}
				>
					<MenuItem className="menuitem" onClick={handleClose}>Profile</MenuItem>
					<MenuItem className="menuitem" onClick={handleClose}>My account</MenuItem>
					<Divider className="divider" />
					<MenuItem className="menuitem" onClick={handleClose}>Logout</MenuItem>
				</Menu>
			</div>
		</ThemeProvider>
	);
}