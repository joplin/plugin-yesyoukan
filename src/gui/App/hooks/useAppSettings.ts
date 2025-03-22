import { useEffect, useState } from "react";
import { AppSettings, getDefaultAppSettings, WebviewApi } from "../../../utils/types";

interface Props {
	webviewApi: WebviewApi;
}

export default (props:Props) => {
	const [appSettings, setAppSettings] = useState<AppSettings>(getDefaultAppSettings());

	useEffect(() => {
		const fn = async () => {
			const output = await props.webviewApi.postMessage<AppSettings>({ type: 'getAppSettings' });
			setAppSettings(output);
		}

		void fn();		
	}, [props.webviewApi]);

	return appSettings;
}