import Logger from "@joplin/utils/Logger";
import { useEffect, useState } from "react";
import { Platform } from "../../../utils/types";

const logger = Logger.create('YesYouKan: usePlatform');

export default () => {
	const [platform, setPlatform] = useState<Platform>('desktop');

	useEffect(() => {
		const rootElement = document.getElementById('root');
		if (rootElement) {
			if (rootElement.classList.contains("platform-mobile")) {
				logger.info('Detected platform: mobile');
				setPlatform('mobile');
			} else {
				logger.info('Detected platform: desktop');
			}
		} else {
			logger.warn('Cannot access the root element - cannot determine the current platform');
		}
	}, []);

	return platform
}