import { CardSettings, Settings, cardSettingItems, settingItems } from "./types";
import { LoggerWrapper } from '@joplin/utils/Logger';

const parseBoolean = (s: string): boolean => {
	if (s === 'true' || s === '1') return true;
	if (s === 'false' || s === '0') return false;
	throw new Error(`Invalid boolean value: "${s}" (Must be one of "true", "false", "0, "1")`);
};

export enum SettingType {
	App = 'app',
	Card = 'card',
}

function parseSettings(type:SettingType, rawSettings:Record<string, string>, logger:LoggerWrapper = null) {
	const output = {};

	const items = type === SettingType.App ? settingItems : cardSettingItems;

	for (const [key, rawValue] of Object.entries(rawSettings)) {
		if (!(key in items)) {
			if (logger) logger.warn('Unknown setting key: ' + key);
			continue;
		}

		const value = items[key].value;
		
		try {
			if (typeof value === 'number') {
				const v = Number(rawValue);
				if (isNaN(v)) throw new Error(`Invalid number value "${rawValue}"`);
				(output as any)[key] = v;
			} else if (typeof value === 'boolean') {
				(output as any)[key] = parseBoolean(rawValue);
			} else if (typeof value === 'string') {
				(output as any)[key] = `${rawValue}`;
			} else {
				throw new Error(`Invalid setting default value type: ${typeof value}`);
			}
		} catch (error) {
			error.message = `Could not parse key "${key}": ${error.message}`;
			throw error;
		}
	}

	if (type === SettingType.App) {
		return output as Settings;
	} else {
		return output as CardSettings;
	}
}

export const parseAppSettings = (rawSettings:Record<string, string>, logger:LoggerWrapper = null) => {
	return parseSettings(SettingType.App, rawSettings, logger) as Settings;
}

export const parseCardSettings = (rawSettings:Record<string, string>, logger:LoggerWrapper = null) => {
	return parseSettings(SettingType.Card, rawSettings, logger) as CardSettings;
}