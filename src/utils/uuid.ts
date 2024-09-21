
export default () => {
	return Math.round(Math.random() * 100000).toString() + '_' + Date.now().toString();
}
