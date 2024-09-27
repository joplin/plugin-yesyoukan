import { Settings, defaultSettings } from "./types";

const parseBoolean = (s: string): boolean => {
	if (s === 'true' || s === '1') return true;
	if (s === 'false' || s === '0') return false;
	throw new Error(`Invalid boolean value: "${s}" (Must be one of "true", "false", "0, "1")`);
};

export function parseSettings(rawSettings:Record<string, string>, logger:typeof console = null): Settings {
	const output: Settings = {};

	for (const [key, rawValue] of Object.entries(rawSettings)) {
		if (!(key in defaultSettings)) {
			if (logger) logger.warn('Unknown setting key: ' + key);
			continue;
		}

		const value = defaultSettings[key];
		
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

	return output;
}
