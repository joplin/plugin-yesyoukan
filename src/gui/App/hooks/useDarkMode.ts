import { useEffect, useState } from "react";
import { WebviewApi } from "../../../utils/types";

interface Props {
	webviewApi: WebviewApi;
}

export default (props:Props) => {
	const [isDarkMode, setIsDarkMode] = useState(false);

	useEffect(() => {
		const fn = async () => {
			const shouldUseDarkColors = await props.webviewApi.postMessage<boolean>({ type: 'shouldUseDarkColors' });
			setIsDarkMode(shouldUseDarkColors);
		}

		void fn();		
	}, [props.webviewApi]);

	return isDarkMode
}