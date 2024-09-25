import * as React from "react";
import { useCallback } from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Divider } from '@mui/material';
import Button from "./Button";

interface MenuItemBase {
	id: string;
	label: string;
	isDivider?: false;
}

interface MenuDivider {
	id?: never;
	label?: never;
	isDivider: true;
}

export type MenuItem = MenuItemBase | MenuDivider;

export interface ItemClickEvent {
	itemId: string;
}

export type ItemClickEventHandler = (event:ItemClickEvent) => void;

interface Props {
	menuItems: MenuItem[];
	onItemClick: ItemClickEventHandler;
}

export default (props:Props) => {
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	
	const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const onClose = () => {
		setAnchorEl(null);
	}

	const onMenuItemClick = useCallback<React.MouseEventHandler>((event) => {
		onClose();
		const itemId = event.currentTarget.getAttribute('data-id');
		props.onItemClick({ itemId });
	}, [onClose, props.onItemClick]);

	const renderMenuItems = () => {
		const output:React.JSX.Element[] = [];
		for (const menuItem of props.menuItems) {
			if (menuItem.isDivider) {
				output.push(<Divider/>);
			} else {
				output.push(<MenuItem data-id={menuItem.id} key={menuItem.id} onClick={onMenuItemClick}>{menuItem.label}</MenuItem>);
			}
		}
		return output;
	}

	return (
		<>
			<Button icon="icon fas fa-ellipsis-v" onClick={onClick} />
			<Menu
				className="context-menu"
				anchorEl={anchorEl}
				open={open}
				onClose={onClose}
				MenuListProps={{
					'aria-labelledby': 'basic-button',
				}}
			>
				{renderMenuItems()}
			</Menu>
		</>
	);
}