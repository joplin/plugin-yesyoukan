import { BoardSettings, CardSettings, PluginSettings, SettingItems, StackSettings, boardSettingItems, cardSettingItems, pluginSettingItems, stackSettingItems } from "./types";
import { LoggerWrapper } from '@joplin/utils/Logger';

const parseBoolean = (s: string): boolean => {
	if (s === 'true' || s === '1') return true;
	if (s === 'false' || s === '0') return false;
	throw new Error(`Invalid boolean value: "${s}" (Must be one of "true", "false", "0, "1")`);
};

export enum SettingType {
	Plugin = 'plugin',
	Board = 'board',
	Card = 'card',
	Stack = 'stack',
}

function parseSettings(type:SettingType, rawSettings:Record<string, string>, logger:LoggerWrapper = null) {
	const output = {};

	const settingTypeToSettingItems:Record<SettingType, SettingItems> = {
		[SettingType.Plugin]: pluginSettingItems,
		[SettingType.Board]: boardSettingItems,
		[SettingType.Stack]: stackSettingItems,
		[SettingType.Card]: cardSettingItems,
	}

	const items = settingTypeToSettingItems[type];

	for (const [key, rawValue] of Object.entries(rawSettings)) {
		if (!(key in items)) {
			if (logger) logger.warn('Unknown setting key: ' + key);
			continue;
		}

		const valueType = items[key].type;

		// const value = items[key].value;
		
		try {
			if (valueType === 1) {
				const v = Number(rawValue);
				if (isNaN(v)) throw new Error(`Invalid number value "${rawValue}"`);
				(output as any)[key] = v;
			} else if (valueType === 3) {
				(output as any)[key] = parseBoolean(rawValue);
			} else if (valueType === 2) {
				(output as any)[key] = `${rawValue}`;
			} else if (valueType === 5) {
				(output as any)[key] = rawValue ? JSON.parse(rawValue) : {};
			} else {
				throw new Error(`Invalid setting default value type: ${valueType}`);
			}
		} catch (error) {
			error.message = `Could not parse key "${key}": ${error.message}`;
			throw error;
		}
	}

	if (type === SettingType.Plugin) {
		return output as PluginSettings;
	} else {
		return output as CardSettings;
	}
}

export const parseBoardSettings = (rawSettings:Record<string, string>, logger:LoggerWrapper = null) => {
	return parseSettings(SettingType.Board, rawSettings, logger) as BoardSettings;
}

export const parseCardSettings = (rawSettings:Record<string, string>, logger:LoggerWrapper = null) => {
	return parseSettings(SettingType.Card, rawSettings, logger) as CardSettings;
}

export const parseStackSettings = (rawSettings:Record<string, string>, logger:LoggerWrapper = null) => {
	return parseSettings(SettingType.Stack, rawSettings, logger) as StackSettings;
}