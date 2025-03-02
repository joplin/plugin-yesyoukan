import Logger from "@joplin/utils/Logger";
import { useEffect, useMemo, useState } from "react";
import { Board, Settings, WebviewApi } from "../../../utils/types";

const logger = Logger.create('YesYouKan: useBaseSettings');

interface Props {
	board: Board;
	webviewApi: WebviewApi;
}

export default (props:Props) => {
	const [baseSettings, setBaseSettings] = useState<Settings>({});
	
	useEffect(() => {
		const fn = async() => {
			const settings = await props.webviewApi.postMessage<Settings>({ type: 'getSettings' });
			logger.info('Loading settings:', settings);
			setBaseSettings(settings);
		}

		void fn();
	}, []);

	const effectiveBoardSettings = useMemo(() => {
		return {
			...baseSettings,
			...props.board.settings,
		}
	}, [props.board.settings, baseSettings]);

	return effectiveBoardSettings;
}