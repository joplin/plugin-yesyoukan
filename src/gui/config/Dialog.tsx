import * as React from 'react';
import { useState } from 'react';
import {
	Dialog, DialogTitle, DialogContent, DialogActions, Button,
	TextField, Checkbox, FormControlLabel, MenuItem,
	IconButton
} from '@mui/material';

export interface Settings {
	stackWidth?: number;
	confirmKey?: 'Enter' | 'Shift+Enter';
	enabled?: boolean;
}

interface SettingsDialogProps {
	settings: Settings;
	defaultSettings: Settings;
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

const SettingsDialog: React.FC<SettingsDialogProps> = ({ settings, defaultSettings, onSave, onClose }) => {
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
			[key]: defaultSettings[key]
		}));
	};

	// Check if the setting differs from its default value
	const isChanged = (key: keyof Settings) => {
		return currentSettings[key] !== defaultSettings[key];
	};

	// Dynamically render controls based on the type of the value in defaultSettings
	const renderControl = (key: keyof Settings) => {
		const currentValue = currentSettings[key];
		const defaultValue = defaultSettings[key];

		// Determine control type based on value type
		if (typeof defaultValue === 'boolean') {
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
				<div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
					<TextField
						fullWidth
						label={key}
						value={currentValue || ''}
						onChange={(e) => handleChange(key, e.target.value)}
					/>
					<ResetButton
						disabled={!isChanged(key)}
						onReset={() => handleReset(key)}
					/>
				</div>
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
		<Dialog open={true} onClose={onClose}>
			<DialogTitle>Settings</DialogTitle>
			<DialogContent>
				{Object.keys(defaultSettings).map((key) => (
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
