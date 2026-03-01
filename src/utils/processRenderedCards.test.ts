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

	it('should handle cards with unclosed code blocks', async () => {
		// This markdown has an unclosed code block which could cause the dividers
		// to be absorbed into a <pre><code> block instead of being wrapped in <p> tags
		const markdownWithUnclosedCodeBlock = `# To Do

## Broken card

\`\`\`javascript
const x = 1;

## Another card

This card comes after

# Done

\`\`\`kanban-settings
# Do not remove this block
\`\`\`
`;

		const board = await parseNote('', markdownWithUnclosedCodeBlock);
		const cardsToRender: Record<string, CardToRender> = {};

		for (const stack of board.stacks) {
			for (const card of stack.cards) {
				cardsToRender[card.id] = {
					source: 'card',
					cardBody: card.body,
					cardTitle: card.title,
					noteId: '',
				};
			}
		}

		// Simulate what the markdown renderer might produce when code blocks interfere with dividers
		// The divider ends up inside the <pre> block instead of being a <p>
		const problematicHtml = `<div id="rendered-md"><p>Broken card</p>
<p>YESYOUKANTITLEBODYMARKER</p>
<pre><code class="language-javascript">const x = 1;

YESYOUKANCARDDIVIDER

Another card

YESYOUKANTITLEBODYMARKER

This card comes after
</code></pre>
</div>`;

		// This should not throw an error - it should handle the missing splits gracefully
		const result = await processRenderedCards(
			cardsToRender,
			async (_noteId: string) => null,
			async (_markup: string, _options: any) => ({
				cssStrings: [],
				html: problematicHtml,
				pluginAssets: [],
			})
		);

		// The result should exist and have entries for the cards
		expect(result).toBeDefined();
		const cardIds = Object.keys(result);
		expect(cardIds.length).toBeGreaterThan(0);

		// Each card should have title and body (even if empty due to parsing issues)
		for (const cardId of cardIds) {
			expect(result[cardId]).toBeDefined();
			expect(result[cardId].title).toBeDefined();
			expect(result[cardId].body).toBeDefined();
		}
	});

	it('should render code blocks with backticks correctly', async () => {
		const markdownWithCodeBlock = `# To Do

## Card with code

\`\`\`javascript
const x = 1;
\`\`\`

# Done

\`\`\`kanban-settings
# Do not remove this block
\`\`\`
`;

		const board = await parseNote('', markdownWithCodeBlock);
		const cardsToRender: Record<string, CardToRender> = {};

		for (const stack of board.stacks) {
			for (const card of stack.cards) {
				cardsToRender[card.id] = {
					source: 'card',
					cardBody: card.body,
					cardTitle: card.title,
					noteId: '',
				};
			}
		}

		// Simulate proper rendering with backticks escaped and then unescaped
		const properHtml = `<div id="rendered-md"><p>Card with code</p>
<p>YESYOUKANTITLEBODYMARKER</p>
<pre><code class="language-javascript">const x = 1;
</code></pre>
</div>`;

		const result = await processRenderedCards(
			cardsToRender,
			async (_noteId: string) => null,
			async (_markup: string, _options: any) => ({
				cssStrings: [],
				html: properHtml,
				pluginAssets: [],
			})
		);

		expect(result).toBeDefined();
		const cardIds = Object.keys(result);
		expect(cardIds.length).toBe(1);

		const card = result[cardIds[0]];
		expect(card.body.html).toContain('const x = 1;');
	});

});