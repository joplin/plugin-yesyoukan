export const escapeTitleText = (text: string) => {
	return text.replace(/(\[|\])/g, '\\$1');
}

export const escapeLinkUrl = (url: string) => {
	url = url.replace(/\(/g, '%28');
	url = url.replace(/\)/g, '%29');
	url = url.replace(/ /g, '%20');
	return url;
}