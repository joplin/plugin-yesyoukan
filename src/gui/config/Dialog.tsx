import * as React from 'react';
import { useState } from 'react';
import {
	Dialog, DialogTitle, DialogContent, DialogActions, Button,
	TextField, Checkbox, FormControlLabel, MenuItem,
	IconButton,
	Box
} from '@mui/material';
import { SettingItems, Settings } from '../../utils/types';
import ColorPicker from '../ColorPicker';
import { getColorValues, lightBackgroundColors } from '../../utils/colors';

export interface ConfigItem {
	
}



function GenericControl({ label, control: Control }) {
	return (
		<Box display="flex" alignItems="center">
			<Box width="30%">
				<label>{label}</label>
			</Box>
			<Box width="70%">
				<Control />
			</Box>
		</Box>
	);
}



interface SettingsDialogProps {
	settings: Record<string, any>;
	settingItems: SettingItems;
	onSave: (newSettings: Settings) => void;
	onClose: () => void;
}

interface ResetButtonProps {
	disabled: boolean;
	onReset: () => void;
}

const ResetButton: React.FC<ResetButtonProps> = ({ disabled, onReset }) => {
	return (
		<IconButton onClick={onReset} disabled={disabled} style={{ marginLeft: '8px' }}>
			<span>X</span>
		</IconButton>
	);
};

const SettingsDialog: React.FC<SettingsDialogProps> = ({ settings, settingItems, onSave, onClose }) => {
	const [currentSettings, setCurrentSettings] = useState<Settings>(settings);

	// Handle value change for any setting
	const handleChange = (key: keyof Settings, value: any) => {
		setCurrentSettings(prevSettings => ({
			...prevSettings,
			[key]: value
		}));
	};

	// Reset value to the default for a particular setting
	const handleReset = (key: keyof Settings) => {
		setCurrentSettings(prevSettings => ({
			...prevSettings,
			[key]: settingItems[key].value,
		}));
	};

	// Check if the setting differs from its default value
	const isChanged = (key: keyof Settings) => {
		return currentSettings[key] !== settingItems[key].value;
	};

	// Dynamically render controls based on the type of the value in defaultSettings
	const renderControl = (key: keyof Settings) => {
		const currentValue = currentSettings[key];
		const settingItem = settingItems[key];
		const defaultValue = settingItems[key].value;

		// Determine control type based on value type
		if (key.includes('backgroundColor')) {
			return (
				<GenericControl
					label={key}
					control={() => <ColorPicker
						colors={lightBackgroundColors}
						value={currentValue as number || 0}
						onChange={(color) => handleChange(key, color)}
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
					<ResetButton
						disabled={!isChanged(key)}
						onReset={() => handleReset(key)}
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
					<ResetButton
						disabled={!isChanged(key)}
						onReset={() => handleReset(key)}
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
						<ResetButton
							disabled={!isChanged(key)}
							onReset={() => handleReset(key)}
						/>
					</div>
				);
			}
			return (
				<GenericControl
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
		onSave(currentSettings);
		onClose();
	};

	return (
		<Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle>Settings</DialogTitle>
			<DialogContent>
				{Object.keys(settingItems).map((key) => (
					<div key={key} style={{ marginBottom: '16px' }}>
						{renderControl(key as keyof Settings)}
					</div>
				))}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button onClick={handleSave} color="primary">Save</Button>
			</DialogActions>
		</Dialog>
	);
};

export default SettingsDialog;
