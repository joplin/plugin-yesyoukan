import * as React from 'react';
import { useState } from 'react';
import {
	Dialog, DialogTitle, DialogContent, DialogActions, Button,
	TextField, Checkbox, FormControlLabel, MenuItem,
} from '@mui/material';
import { SettingItems, Settings } from '../../utils/types';
import ColorPicker from '../ColorPicker';
import { Colors } from '../../utils/colors';
import GenericControl from './GenericControl';

interface Props {
	title: string;
	settings: Record<string, any>;
	settingItems: SettingItems;
	onSave: (newSettings: Settings) => void;
	onClose: () => void;
	isDarkMode: boolean;
	backgroundColor: Colors;
}

const SettingsDialog: React.FC<Props> = (props:Props) => {
	const [currentSettings, setCurrentSettings] = useState<Settings>(props.settings);

	// Handle value change for any setting
	const handleChange = (key: keyof Settings, value: any) => {
		setCurrentSettings((prevSettings) => {
			if (value === undefined) {
				const output = { ...prevSettings };
				delete output[key];
				return output; 
			} else {
				return {
					...prevSettings,
					[key]: value,
				}
			}
		});
	};

	// Dynamically render controls based on the type of the value in defaultSettings
	const renderControl = (key: keyof Settings) => {
		const currentValue = currentSettings[key];
		const settingItem = props.settingItems[key];
		const defaultValue = props.settingItems[key].value;

		const baseGenericControlProps = {
			label: settingItem.label,
			resetDisabled: currentValue === undefined,
			onReset: () => { handleChange(key, undefined) },
		}

		// Determine control type based on value type
		if (key.includes('backgroundColor')) {
			return (
				<GenericControl
					{...baseGenericControlProps}
					control={() => <ColorPicker
						colors={props.backgroundColor}
						value={currentValue as number || 0}
						onChange={(color) => handleChange(key, color)}
						isDarkMode={props.isDarkMode}
					/>}
				/>
			);
		} else if (typeof defaultValue === 'boolean') {
			throw new Error('No implemented: boolean');

			return (
				<div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
					<FormControlLabel
						control={
							<Checkbox
								value={currentValue || false}
								onChange={(e) => handleChange(key, e.target.checked)}
							/>
						}
						label={key}
					/>
				</div>
			);
		} else if (typeof defaultValue === 'number') {
			throw new Error('No implemented: number');

			return (
				<div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
					<TextField
						fullWidth
						label={key}
						type="number"
						value={currentValue || ''}
						onChange={(e) => handleChange(key, parseInt(e.target.value, 10))}
					/>
				</div>
			);
		} else if (typeof defaultValue === 'string') {
			if (key === 'confirmKey') {
				throw new Error('No implemented: confirmKey');

				// Special case for the "confirmKey" field since it has predefined options
				return (
					<div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
						<TextField
							select
							fullWidth
							label={key}
							value={currentValue || ''}
							onChange={(e) => handleChange(key, e.target.value)}
						>
							<MenuItem value="Enter">Enter</MenuItem>
							<MenuItem value="Shift+Enter">Shift+Enter</MenuItem>
						</TextField>
					</div>
				);
			}
			return (
				<GenericControl
					onReset={() => {}}
					resetDisabled={false}
					label={key}
					control={() => <TextField
						fullWidth
						label={key}
						value={currentValue || ''}
						onChange={(e) => handleChange(key, e.target.value)}
					/>}
				/>
			);
		}
		return null;
	};

	// Save current settings and close dialog
	const handleSave = () => {
		props.onSave(currentSettings);
		props.onClose();
	};

	return (
		<Dialog open={true} onClose={props.onClose} fullWidth maxWidth="sm">
			<DialogTitle>{props.title}</DialogTitle>
			<DialogContent>
				{Object.keys(props.settingItems).map((key) => (
					<div key={key} style={{ marginBottom: '16px' }}>
						{renderControl(key as keyof Settings)}
					</div>
				))}
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onClose}>Cancel</Button>
				<Button onClick={handleSave} color="primary">Save</Button>
			</DialogActions>
		</Dialog>
	);
};

export default SettingsDialog;
