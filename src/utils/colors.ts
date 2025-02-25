export type Colors = Record<number, string>;

// TODO: add support for dark theme

export const lightBackgroundColors: Colors = {
	0: '', // Default
	1: '#fff8dc', // cornsilk (yellow)
	2: '#fffacd', // lemon chiffon (yellow)
	3: '#ffffe0', // pale yellow (yellow-green)
	4: '#90ee90', // light green (green)
	5: '#f0fff0', // honeydew (green-white)
	6: '#e0ffff', // light cyan (cyan)
	7: '#add8e6', // light blue (blue)
	8: '#f0f8ff', // alice blue (blue-white)
	9: '#e6e6fa', // lavender (blue-purple)
	10: '#d8bfd8', // thistle (purple)
	11: '#ffe5b4', // peach (orange)
	12: '#ffb6c1', // light pink (red-pink)
	13: '#fffafa', // snow (white-pink)
	14: '#fff5ee', // seashell (orange-white)
	15: '#f5fffa', // mint cream (green-white)
	16: '#f0f0f0', // light gray (neutral)
};

export const getColorValues = (colors:Colors) => {
	const output:string[] = [];
	for (const [, value] of Object.entries(colors)) {
		if (!value) continue;
		output.push(value);
	}
	return output;
}

export const colorValueToId = (colors:Colors, colorValue:string) => {
	colorValue = colorValue.toLowerCase();
	for (const [id, value] of Object.entries(colors)) {
		if (value === colorValue) return Number(id);
	}
	throw new Error('Invalid color value: ' + colorValue);
}

export const colorIdToValue = (colors:Colors, colorId:number) => {
	for (const [id, value] of Object.entries(colors)) {
		if (id.toString() === colorId.toString()) return value;
	}
	throw new Error('Invalid color ID: ' + colorId);
}

export const colorsToCss = (colors:Colors, classPrefix:string, cssProp:string) => {
	const output:string[] = [];
	for (const [id, value] of Object.entries(colors)) {
		if (!value) continue;
		output.push(`.${classPrefix}-${id} { ${cssProp}: ${value}; }`)
	}
	return output.join('\n');
}