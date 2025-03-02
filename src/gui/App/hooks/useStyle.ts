import { useMemo } from "react";
import { Colors, colorsToCss } from "../../../utils/colors";

interface Props {
	stackDynamicWidth: boolean;
	stackWidth: number;
	backgroundColors: Colors;
	cssStrings: string[];
}

export default (props:Props) => {
	// A more natural way to do this would be to set the `style` prop on the stack element. However
	// doing this interfers with Beautiful DND and makes the stacks no longer draggable. It seems to
	// be fine with CSS being set via stylesheet though, so we do that here.
	const appStyle = useMemo(() => {
		const styles:string[] = [];

		if (!props.stackDynamicWidth) {
			styles.push( `
				.stack {
					width: ${props.stackWidth}px;
					max-width: ${props.stackWidth}px;
				}
			`);
		} else {
			styles.push( `
				.stack {
					min-width: 10px;
				}
			`);
		}

		styles.push(colorsToCss(props.backgroundColors, 'background', 'background-color'));

		styles.push(props.cssStrings.join('\n'));

		return styles.join('\n\n');
	}, [props.stackDynamicWidth, props.stackWidth, props.backgroundColors, props.cssStrings]);

	return appStyle;
}