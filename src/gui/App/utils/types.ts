import { CardSettings, SettingItems, PluginSettings } from "../../../utils/types";

export interface DialogConfig {
	title: string;
	settings: PluginSettings | CardSettings;
	settingItems: SettingItems;
	onSave: (newSettings: PluginSettings | CardSettings) => void;
}

export interface AfterSetNoteAction {
	type: string;
	noteId: string;
}
