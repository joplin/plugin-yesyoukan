import * as React from "react";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { Board, CardSettings, CardToRender, IpcMessage, Note, Platform, RenderResult, RenderedNote, SettingItems, Settings, WebviewApi, cardSettingItems, emptyBoard, settingItems } from "./utils/types";
import StackViewer, { AddCardEventHandler, DeleteEventHandler, TitleChangeEventHandler } from "./gui/StackViewer";
import { DragDropContext, Droppable, OnDragEndResponder } from "@hello-pangea/dnd";
import { produce} from "immer"
import { boardsEqual, noteIsBoard, parseAsNoteLink, parseNote, serializeBoard } from "./utils/noteParser";
import AsyncActionQueue from "./utils/AsyncActionQueue";
import { EditorSubmitHandler as CardChangeEventHandler, DeleteEventHandler as CardDeleteEventHandler, EditorCancelHandler, EditorStartHandler, CardHandler, CardEvent } from "./gui/CardViewer";
import { findCard, findCardIndex, findStackIndex, getCardTitleAndIndex } from "./utils/board";
import { ThemeProvider, createTheme } from "@mui/material";
import Toolbar from './gui/Toolbar';
import { Props as ButtonProps } from './gui/Button';
import uuid from "./utils/uuid";
import Logger from '@joplin/utils/Logger';
import getHash from "./utils/getHash";
import { toggleCheckbox } from "./utils/renderMarkupUtils";
import setupFontAwesome from "./utils/setupFontAwesome";
import SettingsDialog from "./gui/config/Dialog";
import { getDefaultSettings } from "http2";
import { colorsToCss, lightBackgroundColors } from "./utils/colors";

const logger = Logger.create('YesYouKan: App');

declare var webviewApi: WebviewApi;

setupFontAwesome();

const updateNoteQueue = new AsyncActionQueue(100);

let computedStyle_:CSSStyleDeclaration|null = null;
const getCssVariable = (variableName: string) => {
	if (!computedStyle_) computedStyle_ = getComputedStyle(document.documentElement);
	return computedStyle_.getPropertyValue(variableName).trim();
}

const sharedControlStyle:any = {
	styleOverrides: {
		root: {
			'& .MuiOutlinedInput-notchedOutline': {
				borderColor: getCssVariable('--joplin-divider-color'), // Set default border color
			},
			'&:hover .MuiOutlinedInput-notchedOutline': {
				borderColor: getCssVariable('--joplin-color'), // Set hover color
			},
			'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
				borderColor: getCssVariable('--joplin-color'), // Set focused color
			},
		},
	},
};

const theme = createTheme({
	palette: {
		background: {
			default: getCssVariable('--joplin-background-color'),
		},
		primary: {
			main: getCssVariable('--joplin-color'), 
		},
		text: {
			primary: getCssVariable('--joplin-color'), 
		},
		divider: getCssVariable('--joplin-divider-color'),
	},

	components: {
		MuiMenuItem: {
			styleOverrides: {
				root: {
					color: getCssVariable('--joplin-color'),
					'&:hover': {
						backgroundColor: getCssVariable('--joplin-selected-color'),
						color: getCssVariable('--joplin-color'),
					},
				},
			},
		},
		MuiPopover: {
			styleOverrides: {
				paper: {
					backgroundColor: getCssVariable('--joplin-background-color'),
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					color: getCssVariable('--joplin-color'),
					'&.Mui-disabled': {
						color: getCssVariable('--joplin-color'),
						opacity: 0.4,
					},
				},
			},
		},
		MuiDialog: {
			styleOverrides: {
				paper: {
					backgroundColor: getCssVariable('--joplin-background-color'),
					color: getCssVariable('--joplin-color'),
				},
			},
		},
		MuiDialogContent: {
			styleOverrides: {
				root: {
					backgroundColor: getCssVariable('--joplin-background-color'),
					paddingTop: '10px !important',
				},
			},
		},
		MuiOutlinedInput: sharedControlStyle,
		MuiTextField: sharedControlStyle,
		MuiSelect: sharedControlStyle,
		MuiInputBase: sharedControlStyle,
		MuiFormLabel: {
			styleOverrides: {
				root: {
					color: getCssVariable('--joplin-color'), // Set default label color
					'&.Mui-focused': {
						color: getCssVariable('--joplin-color'), // Set color when focused
					},
					'&.MuiFormLabel-filled': {
						color: getCssVariable('--joplin-color'), // Set color when filled
					},
				},
			},
		},
	},
});

interface HistoryItem {
	board: Board;
}

interface History {
	undo: HistoryItem[];
	redo: HistoryItem[];
}

// We support anything that looks like a URL - we just want to send it back to the app via the
// `openItem` command.
const isSupportedUrl = (text:string) => {
	return !!text.match(/^[a-zA-Z\-]+:.+/);
}

const emptyHistory = ():History => {
	return {
		undo: [],
		redo: [],
	}
}

interface AfterSetNoteAction {
	type: string;
	noteId: string;
}

interface DialogConfig {
	settings: Settings | CardSettings;
	settingItems: SettingItems;
	onSave: (newSettings: Settings | CardSettings) => void;
}

export const App = () => {
	const [board, setBoard] = useState<Board>(emptyBoard());
	const [baseSettings, setBaseSettings] = useState<Settings>({});
	const [history, setHistory] = useState<History>(emptyHistory);
	const ignoreNextBoardUpdate = useRef<boolean>(false);
	const [editedCardIds, setEditedCardIds] = useState<string[]>([]);
	const [enabled, setEnabled] = useState<boolean>(false);
	const [isReadySent, setIsReadySent] = useState<boolean>(false);
	const [cssStrings, setCssStrings] = useState([]);
	const [platform, setPlatform] = useState<Platform>('desktop');
	const afterSetNoteAction = useRef<AfterSetNoteAction|null>(null);
	const [dialogConfig, setDialogConfig] = useState<DialogConfig|null>(null);

	const effectiveBoardSettings = useMemo(() => {
		return {
			...baseSettings,
			...board.settings,
		}
	}, [board.settings, baseSettings]);

	const startCardEditing = (cardId:string) => {
		setEditedCardIds(current => {
			return produce(current, draft => {
				const index = draft.findIndex(id => id === cardId);
				if (index >= 0) return;
				draft.push(cardId);
			});
		});
	}

	const stopCardEditing = (cardId:string) => {
		setEditedCardIds(current => {
			return produce(current, draft => {
				const index = draft.findIndex(id => id === cardId);
				if (index >= 0) draft.splice(index, 1);
			});
		});
	}

	const onCardEditorStart = useCallback<EditorStartHandler>((event) => {
		startCardEditing(event.card.id);
	}, []);
	
	const onCardChange = useCallback<CardChangeEventHandler>((event) => {
		pushUndo(board);

		const cardId = event.card.id;

		const newBoard = produce(board, draft => {
			const [stackIndex, cardIndex] = findCardIndex(draft, cardId);
			const newCard = draft.stacks[stackIndex].cards[cardIndex];
			newCard.title = event.card.title;
			newCard.body = event.card.body;
		});

		setBoard(newBoard);

		stopCardEditing(cardId);
	}, [board]);

	const onCardEditorCancel = useCallback<EditorCancelHandler>((event) => {
		stopCardEditing(event.card.id);
	}, []);

	const onScrollToCard = useCallback<CardHandler>((event) => {
		const { title, index } = getCardTitleAndIndex(board, event.cardId);
		void webviewApi.postMessage<string>({ type: 'scrollToCard', value: {
			cardTitle: title,
			cardIndex: index,
		}});
	}, [board]);

	const onCreateNoteFromCard = useCallback<CardHandler>(async (event) => {
		const card = findCard(board, event.cardId);

		const newNote = await webviewApi.postMessage<Note>({
			type: 'createNote',
			value: { 
				title: card.title,
				body: card.body,
			}
		});

		const newBoard = produce(board, draft => {
			const [stackIndex, cardIndex] = findCardIndex(draft, event.cardId);
			const newCard = draft.stacks[stackIndex].cards[cardIndex];
			newCard.title = `[${newNote.title}](:/${newNote.id})`
			newCard.body = '';
		});

		afterSetNoteAction.current = {
			type: 'openNote',
			noteId: newNote.id,
		};

		setBoard(newBoard);
	}, [board]);

	const onOpenAssociatedNote = useCallback<CardHandler>(async (event) => {
		const card = findCard(board, event.cardId);
		const parsedTitle = parseAsNoteLink(card.title);
		if (!parsedTitle) {
			logger.warn('Card has not associated note:', card);
		} else {
			await webviewApi.postMessage({
				type: 'openNote',
				value: parsedTitle.id
			});
		}
	}, [board]);

	const onAddCard = useCallback<AddCardEventHandler>((event) => {
		pushUndo(board);

		const newCardId = uuid();

		const newBoard = produce(board, draft => {
			const stackIndex = findStackIndex(board, event.stackId);
			draft.stacks[stackIndex].cards.push({
				id: newCardId,
				title: 'New card',
				body: '',
			});
		});

		setBoard(newBoard);

		startCardEditing(newCardId);
	}, [board]);

	const onDeleteCard = useCallback<CardDeleteEventHandler>(async (event) => {
		const card = findCard(board, event.cardId);
		const parsedTitle = parseAsNoteLink(card.title);

		if (parsedTitle) {
			const answer = confirm('This will also delete the associated note. Continue?');
			if (!answer) return;

			await webviewApi.postMessage({
				type: 'deleteNote',
				value: parsedTitle.id
			});
		} else {
			pushUndo(board);
		}

		const newBoard = produce(board, draft => {
			const [stackIndex, cardIndex] = findCardIndex(draft, event.cardId);
			draft.stacks[stackIndex].cards.splice(cardIndex, 1);
		});

		setBoard(newBoard);
	}, [board]);

	const onEditCardSettings = useCallback<CardHandler>(async (event) => {
		const card = findCard(board, event.cardId);
		setDialogConfig({
			settingItems: cardSettingItems,
			settings: { ...card.settings },
			onSave: (newSettings: CardSettings) => {
				const newBoard = produce(board, draft => {
					const [stackIndex, cardIndex] = findCardIndex(draft, event.cardId);
					draft.stacks[stackIndex].cards[cardIndex].settings = newSettings;
				});
				setBoard(newBoard);
			},
		});
	}, [board]);

	const onStackTitleChange = useCallback<TitleChangeEventHandler>((event) => {
		pushUndo(board);

		const newBoard = produce(board, draft => {
			const stackIndex = findStackIndex(board, event.stackId);
			draft.stacks[stackIndex].title = event.title;
		});

		setBoard(newBoard);
	}, [board]);

	const pushUndo = (board:Board) => {
		setHistory(current => {
			return produce(current, draft => {
				draft.undo.push({ board });
				draft.redo = [];
			}); 
		});
	}

	const clearUndo = () => {
		setHistory(emptyHistory());
	}

	const onStackDelete = useCallback<DeleteEventHandler>((event) => {
		pushUndo(board);

		const newBoard = produce(board, draft => {
			const stackIndex = findStackIndex(board, event.stackId);
			draft.stacks.splice(stackIndex, 1);
		});

		setBoard(newBoard);
	}, [board]);

	const renderStacks = () => {
		const output:React.JSX.Element[] = [];
		for (let [index, stack] of board.stacks.entries()) {
			output.push(<StackViewer
				onDelete={onStackDelete}
				onTitleChange={onStackTitleChange}
				onCardEditorStart={onCardEditorStart}
				onCardEditorSubmit={onCardChange}
				onCardEditorCancel={onCardEditorCancel}
				onScrollToCard={onScrollToCard}
				onCreateNoteFromCard={onCreateNoteFromCard}
				onOpenAssociatedNote={onOpenAssociatedNote}
				onEditCardSettings={onEditCardSettings}
				onAddCard={onAddCard}
				onDeleteCard={onDeleteCard}
				key={stack.id}
				value={stack}
				platform={platform}
				index={index}
				confirmKey={effectiveBoardSettings.confirmKey}
				newlineKey={effectiveBoardSettings.newlineKey}
				editedCardIds={editedCardIds}
			/>);
		}
		return output;
	}

	useEffect(() => {
		const rootElement = document.getElementById('root');
		if (rootElement) {
			if (rootElement.classList.contains("platform-mobile")) {
				logger.info('Detected platform: mobile');
				setPlatform('mobile');
			} else {
				logger.info('Detected platform: desktop');
			}
		} else {
			logger.warn('Cannot access the root element - cannot determine the current platform');
		}
	}, []);

	useEffect(() => {
		// "cardPostMessage" is defined when calling the `renderMarkup` command. The checkbox
		// rendered by this command will post a message in the form `checkboxclick:<line_index>`. We
		// capture this message and send it back - it will then be processed at the app level.
		//
		// We wrap it in a second function so that we can capture the card ID, which is needed to
		// know which part of the note needs to be updated.

		const script = document.createElement('script');
		script.textContent =  `
			const cardPostMessage = (cardId) => {
				return (message) => {
					postMessage({
						type: "cardMessage",
						value: {
							cardId,
							message,
						},
					});
				};
			}
		`;
	  	  
		document.body.appendChild(script);
	  
		return () => {
			document.body.removeChild(script);
		}
	}, []);

	useEffect(() => {
		const fn = async() => {
			const note = await webviewApi.postMessage<Note>({ type: 'getNote' });
			if (!noteIsBoard(note.body)) {
				setEnabled(false);
				return;
			}
			const newBoard = await parseNote(note.id, note.body);
			setEnabled(true);
			setBoard(newBoard);
		}

		void fn();
	}, []);

	useEffect(() => {
		const fn = async() => {
			const settings = await webviewApi.postMessage<Settings>({ type: 'getSettings' });
			logger.info('Loading settings:', settings);
			setBaseSettings(settings);
		}

		void fn();
	}, []);
	
	useEffect(() => {
		const fn = async() => {
			if (isReadySent) return;
			setIsReadySent(true);
			logger.info('Sending isReady message...');
			await webviewApi.postMessage<string>({ type: 'isReady' });
		}

		void fn();
	}, [isReadySent]);

	useEffect(() => {
		const handlUrl = async (message:string) => {
			if (isSupportedUrl(message)) {
				await webviewApi.postMessage<string>({ type: 'openItem', value: message });
			}
		}

		const onMessage = async (event: MessageEvent<any>) => {
			const message = event.data;

			// These messages are internal messages sent within the app webview and can be ignored
			if ((message as any).kind === 'ReturnValueResponse') return;
			if ((message as any).postMessage?.kind === 'ReturnValueResponse') return;

			if (typeof message === 'string') {
				await handlUrl(message);
 			} else {
				const asIpcMessage = message as IpcMessage;
				if (asIpcMessage && asIpcMessage.type === "cardMessage") {
					const cardId = asIpcMessage.value.cardId;
					const cardMessage = asIpcMessage.value.message as string;

					if (cardMessage.startsWith('checkboxclick:')) {
						setBoard(current => produce(current, draft => {
							const [stackIndex, cardIndex] = findCardIndex(current, cardId);
							const cardBody = current.stacks[stackIndex].cards[cardIndex].body;
							const newBody = toggleCheckbox(cardMessage, cardBody);
							draft.stacks[stackIndex].cards[cardIndex].body = newBody;
						}));
					} else {
						await handlUrl(cardMessage);
					}
				}
			}
		}

		window.addEventListener("message", onMessage);
		
		return () => {
			window.removeEventListener('message', onMessage);
		}
	}, []);

	useEffect(() => {
		webviewApi.onMessage(async (event) => {
			const message = event.message;

			if (!enabled) return;

			if (message.type === 'setNote') {
				const note = message.value as Note;
				const newBoard = await parseNote(note.id, note.body);
				setBoard(current => {
					if (boardsEqual(current, newBoard)) {
						logger.info('Board has not changed - skipping update');
						return current;
					}
					logger.info('Boad has changed - updating');
					clearUndo();
					ignoreNextBoardUpdate.current = true;
					return newBoard;
				});
			} else {
				logger.warn('Unknown message:' + JSON.stringify(message));
			}
		});
	}, [enabled]);

	useEffect(() => {
		if (!ignoreNextBoardUpdate.current) {
			updateNoteQueue.push(async () => {
				logger.info('Boad has changed - updating note body...');
				const noteBody = serializeBoard(board);
				await webviewApi.postMessage({ type: 'setNote', value: { id: board.noteId, body: noteBody }});

				if (afterSetNoteAction.current) {
					const action = afterSetNoteAction.current;
					afterSetNoteAction.current = null;
					if (action.type === 'openNote') {
						await webviewApi.postMessage({ type: 'openNote', value: action.noteId });
					}
				}
			});
		}
		ignoreNextBoardUpdate.current = false;
	}, [board]);

	useEffect(() => {
		let cancelled = false;
		const fn = async () => {
			const cardsToRender:Record<string, CardToRender> = {};
			const bodyHtmlHashes:Record<string, string> = {};
			for (const stack of board.stacks) {
				for (const card of stack.cards) {
					const bodyHash = await getHash(card.title + '\n' + card.body);
					if (card.bodyHtmlHash === bodyHash) continue;
					const linkedNote = parseAsNoteLink(card.title);
					bodyHtmlHashes[card.id] = bodyHash;
					cardsToRender[card.id] = {
						source: linkedNote ? 'note' : 'card',
						noteId: linkedNote ? linkedNote.id : '',
						cardTitle: linkedNote ? '' : card.title,
						cardBody: linkedNote ? '' : card.body,
					}
				}
			}

			const rendered = await webviewApi.postMessage<Record<string, RenderedNote>>({ type: 'renderBodies', value: JSON.stringify(cardsToRender) });
			if (cancelled) return;

			setBoard(current => {
				return produce(current, draft => {
					for (const [cardId, result] of Object.entries(rendered)) {
						const [stackIndex, cardIndex] = findCardIndex(board, cardId);
						draft.stacks[stackIndex].cards[cardIndex].bodyHtmlHash = bodyHtmlHashes[cardId];
						draft.stacks[stackIndex].cards[cardIndex].titleHtml = result.title.html;
						draft.stacks[stackIndex].cards[cardIndex].bodyHtml = result.body.html;
					}
				});
			});

			setCssStrings(current => {
				return produce(current, draft => {
					for (const [, result] of Object.entries(rendered)) {
						for (const cssString of result.body.cssStrings) {
							if (!draft.includes(cssString)) {
								draft.push(cssString);
							}
						}
					}
				});
			});
		}

		void fn();

		return () => {
			cancelled = true;
		}
	}, [board]);

	const onUndoBoard = useCallback(() => {
		if (history.undo.length) {
			const undoItem = history.undo[history.undo.length - 1];
			setHistory(current => {
				return produce(current, draft => {
					draft.redo.push({ board });
					draft.undo.pop();
				});
			});
			setBoard(undoItem.board);
		}
	}, [history, board]);

	const onRedoBoard = useCallback(() => {
		if (history.redo.length) {
			const redoItem = history.redo[history.redo.length - 1];
			setHistory(current => {
				const newHistory = produce(current, draft => {
					draft.undo.push({ board });
					draft.redo.pop();
				});
				return newHistory;
			});
			setBoard(redoItem.board);
		}
	}, [history, board]);

	const onAddStack = useCallback(() => {
		pushUndo(board);

		setBoard(current => {
			const newBoard = produce(current, draft => {
				draft.stacks.push({
					cards: [],
					title: 'New stack',
					id: uuid(),
				});
			});
			return newBoard;
		});
	}, [board]);

	const onDragEnd:OnDragEndResponder = useCallback((result) => {
		const { destination, source, type } = result;

		if (!destination) return;
		if (destination.droppableId === source.droppableId && destination.index === source.index) return

		pushUndo(board);

		if (type === 'card') {
			const newBoard = produce(board, draft => {
				const sourceStack = draft.stacks.find(s => s.id === source.droppableId);
				const destinationStack = draft.stacks.find(s => s.id === destination.droppableId);
				const removed = sourceStack.cards.splice(source.index, 1);
				destinationStack.cards.splice(destination.index, 0, removed[0]);
			});

			setBoard(newBoard);
		} else if (type === "column") {
			const newBoard = produce(board, draft => {
				const removed = draft.stacks.splice(source.index, 1);
				draft.stacks.splice(destination.index, 0, removed[0]);
			});

			setBoard(newBoard);
		} else {
			throw new Error('Unknown type: ' + type);
		}
	}, [board]);

	const toolbarButtons = useMemo(() => {
		const output:ButtonProps[] = [
			{
				name: 'undo',
				icon: 'undo',
				disabled: !history.undo.length,
				title: 'Undo',
				onClick: () => {
					onUndoBoard();
				},
			},

			{
				name: 'redo',
				icon: 'redo',
				disabled: !history.redo.length,
				title: 'Redo',
				onClick: () => {
					onRedoBoard();
				},
			},

			{
				name: 'newStack',
				icon: 'plus',
				title: 'New stack',
				onClick: () => {
					onAddStack();
				},
			},
		];		
		return output;
	}, [onUndoBoard, onRedoBoard, history.undo.length, history.redo.length, onAddStack]);

	const onSettingsDialogClose = useCallback(() => {
		setDialogConfig(null);
	}, []);

	const renderSettingsDialog = () => {
		if (!dialogConfig) return;

		return (
			<SettingsDialog
				settingItems={dialogConfig.settingItems}
				settings={dialogConfig.settings}
				onClose={onSettingsDialogClose}
				onSave={dialogConfig.onSave}
			/>
		);
	}

	// A more natural way to do this would be to set the `style` prop on the stack element. However
	// doing this interfers with Beautiful DND and makes the stacks no longer draggable. It seems to
	// be fine with CSS being set via stylesheet though, so we do that here.
	const appStyle = `
		.stack {
			width: ${effectiveBoardSettings.stackWidth}px;
			max-width: ${effectiveBoardSettings.stackWidth}px;
		}

		${colorsToCss(lightBackgroundColors, 'background', 'background-color')}

		${cssStrings.join('\n')}
	`;

	return (
		<ThemeProvider theme={theme}>
			<div className="app">
				{renderSettingsDialog()}
				<style>{appStyle}</style>
				<Toolbar buttons={toolbarButtons}/>
				<div className="stacks">
					<DragDropContext onDragEnd={onDragEnd}>
						<Droppable droppableId="all" direction="horizontal" type="column">
							{(provided) => {
								return (
									<div className="stacks-inner" ref={provided.innerRef}>
										{renderStacks()}
										{provided.placeholder}
									</div>
								);
							}}
						</Droppable>
					</DragDropContext>
				</div>
			</div>
		</ThemeProvider>
	);
}