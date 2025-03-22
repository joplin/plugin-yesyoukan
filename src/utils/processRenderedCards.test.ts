import { parseNote } from "./noteParser";
import processRenderedCards from "./processRenderedCards";
import { CardToRender } from "./types";

const docMarkdown = `# Backlog

## Card 1

- [x] Checkbox 1 1
- [ ] Checkbox 1 2

## Card 2

- [ ] Checkbox 2 1
- [ ] Checkbox 2 2

# In progress

# Done

\`\`\`kanban-settings
# Do not remove this block
\`\`\`
`;

const bigDocHtml = `<div id="rendered-md"><p>Card 1</p>
<p>YESYOUKANTITLEBODYMARKER</p>
<ul>
<li class="md-checkbox joplin-checkbox"><div class="checkbox-wrapper"><input type="checkbox" id="md-checkbox-4" onclick="
		try {
			if (this.checked) {
				this.setAttribute('checked', 'checked');
			} else {
				this.removeAttribute('checked');
			}

			cardPostMessage(&quot;YESYOUCANCARDIDTHATNEEDSTOBECHANGED&quot;)('checkboxclick:checked:4');
			const label = document.getElementById(&quot;cb-label-md-checkbox-4&quot;);
			label.classList.remove(this.checked ? 'checkbox-label-unchecked' : 'checkbox-label-checked');
			label.classList.add(this.checked ? 'checkbox-label-checked' : 'checkbox-label-unchecked');
		} catch (error) {
			console.warn('Checkbox unchecked:4 error', error);
		}
		return true;
	"><label id="cb-label-md-checkbox-4" for="md-checkbox-4" class="checkbox-label-unchecked">Checkbox 1 1</label></div></li>
<li class="md-checkbox joplin-checkbox"><div class="checkbox-wrapper"><input type="checkbox" id="md-checkbox-5" onclick="
		try {
			if (this.checked) {
				this.setAttribute('checked', 'checked');
			} else {
				this.removeAttribute('checked');
			}

			cardPostMessage(&quot;YESYOUCANCARDIDTHATNEEDSTOBECHANGED&quot;)('checkboxclick:unchecked:5');
			const label = document.getElementById(&quot;cb-label-md-checkbox-5&quot;);
			label.classList.remove(this.checked ? 'checkbox-label-unchecked' : 'checkbox-label-checked');
			label.classList.add(this.checked ? 'checkbox-label-checked' : 'checkbox-label-unchecked');
		} catch (error) {
			console.warn('Checkbox unchecked:5 error', error);
		}
		return true;
	"><label id="cb-label-md-checkbox-5" for="md-checkbox-5" class="checkbox-label-unchecked">Checkbox 1 2</label></div></li>
</ul>
<p>YESYOUKANCARDDIVIDER</p>
<p>Card 2</p>
<p>YESYOUKANTITLEBODYMARKER</p>
<ul>
<li class="md-checkbox joplin-checkbox"><div class="checkbox-wrapper"><input type="checkbox" id="md-checkbox-6" onclick="
		try {
			if (this.checked) {
				this.setAttribute('checked', 'checked');
			} else {
				this.removeAttribute('checked');
			}

			cardPostMessage(&quot;YESYOUCANCARDIDTHATNEEDSTOBECHANGED&quot;)('checkboxclick:unchecked:13');
			const label = document.getElementById(&quot;cb-label-md-checkbox-6&quot;);
			label.classList.remove(this.checked ? 'checkbox-label-unchecked' : 'checkbox-label-checked');
			label.classList.add(this.checked ? 'checkbox-label-checked' : 'checkbox-label-unchecked');
		} catch (error) {
			console.warn('Checkbox unchecked:13 error', error);
		}
		return true;
	"><label id="cb-label-md-checkbox-6" for="md-checkbox-6" class="checkbox-label-unchecked">Checkbox 2 1</label></div></li>
<li class="md-checkbox joplin-checkbox"><div class="checkbox-wrapper"><input type="checkbox" id="md-checkbox-7" onclick="
		try {
			if (this.checked) {
				this.setAttribute('checked', 'checked');
			} else {
				this.removeAttribute('checked');
			}

			cardPostMessage(&quot;YESYOUCANCARDIDTHATNEEDSTOBECHANGED&quot;)('checkboxclick:unchecked:14');
			const label = document.getElementById(&quot;cb-label-md-checkbox-7&quot;);
			label.classList.remove(this.checked ? 'checkbox-label-unchecked' : 'checkbox-label-checked');
			label.classList.add(this.checked ? 'checkbox-label-checked' : 'checkbox-label-unchecked');
		} catch (error) {
			console.warn('Checkbox unchecked:14 error', error);
		}
		return true;
	"><label id="cb-label-md-checkbox-7" for="md-checkbox-7" class="checkbox-label-unchecked">Checkbox 2 2</label></div></li>
</ul>
</div>`

describe('processRenderedCards', () => {

	it('should process a rendered card', async () => {
		const board = await parseNote('', docMarkdown);
		const cardsToRender:Record<string, CardToRender> = {};

		for (const card of board.stacks[0].cards) {
			cardsToRender[card.id] = {
				source: 'card',
				cardBody: card.body,
				cardTitle: card.title,
				noteId: '',
			}
		}

		const result = await processRenderedCards(cardsToRender, async (noteId:string) => { return null; }, async (_markup:string, _options:any) => {
			return {
				cssStrings: [],
				html: bigDocHtml,
				pluginAssets: [],
			}
		});

		const cardIds = Object.keys(result);
	
		const renderedCard1 = result[cardIds[0]];
		const renderedCard2 = result[cardIds[1]];

		expect(renderedCard1.body.html.includes('checkboxclick:checked:0'));
		expect(renderedCard1.body.html.includes('checkboxclick:unchecked:1'));
		expect(renderedCard1.body.html.includes('cardPostMessage(&quot;' + cardIds[0] + '&quot;)'));

		expect(renderedCard2.body.html.includes('checkboxclick:unchecked:0'));
		expect(renderedCard2.body.html.includes('checkboxclick:unchecked:1'));
		expect(renderedCard1.body.html.includes('cardPostMessage(&quot;' + cardIds[1] + '&quot;)'));
	});

});