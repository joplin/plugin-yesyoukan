import { CardSettings, SettingItems, Settings } from "../../../utils/types";

export interface DialogConfig {
	title: string;
	settings: Settings | CardSettings;
	settingItems: SettingItems;
	onSave: (newSettings: Settings | CardSettings) => void;
}