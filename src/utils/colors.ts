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
	15: '#f0f0f0', // light gray (neutral)
};

export const darkBackgroundColors: Colors = {
	0: '', // Default
	1: '#4b3f2f', // dark cornsilk (yellow-brown)
	2: '#5c5236', // dark lemon chiffon (yellow-brown)
	3: '#5f5a33', // dark pale yellow (yellow-green)
	4: '#2e4d2e', // dark green (forest green)
	5: '#3a4d3a', // dark honeydew (green-gray)
	6: '#3a4e4e', // dark cyan (teal-gray)
	7: '#2b4c5c', // dark blue (steel blue)
	8: '#2e3e5c', // dark alice blue (blue-gray)
	9: '#3e3a5c', // dark lavender (purple-gray)
	10: '#4d3b4d', // dark thistle (purple-brown)
	11: '#5c3a2e', // dark peach (brown-orange)
	12: '#5c2e3a', // dark pink (red-brown)
	13: '#4a3a3a', // dark snow (warm gray)
	14: '#4d3b32', // dark seashell (orange-brown)
	15: '#3a3a3a', // dark gray (neutral)
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