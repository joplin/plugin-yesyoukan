export default function(element:HTMLTextAreaElement|HTMLInputElement) {
	element.setSelectionRange(element.value.length, element.value.length);
}