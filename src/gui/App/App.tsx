import * as React from "react";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { Board, CardSettings, CardToRender, IpcMessage, Note, Platform, RenderedNote, Settings, StackSettings, WebviewApi, cardSettingItems, emptyBoard, stackSettingItems, SettingItems, Tag } from "../../utils/types";
import StackViewer, { AddCardEventHandler, StackEventHandler, TitleChangeEventHandler } from "../StackViewer";
import { DragDropContext, Droppable, OnDragEndResponder } from "@hello-pangea/dnd";
import { produce} from "immer"
import { boardsEqual, noteIsBoard, parseAsNoteLink, parseNote, serializeBoard } from "../../utils/noteParser";
import AsyncActionQueue from "../../utils/AsyncActionQueue";
import { EditorSubmitHandler as CardChangeEventHandler, DeleteEventHandler as CardDeleteEventHandler, EditorCancelHandler, EditorStartHandler, CardHandler } from "../CardViewer";
import { findCard, findCardIndex, findStack, findStackIndex, getCardNotes, getCardTitleAndIndex } from "../../utils/board";
import { ThemeProvider, createTheme } from "@mui/material";
import Toolbar from '../Toolbar';
import { Props as ButtonProps } from '../Button';
import uuid from "../../utils/uuid";
import Logger from '@joplin/utils/Logger';
import getHash from "../../utils/getHash";
import { toggleCheckbox } from "../../utils/renderMarkupUtils";
import setupFontAwesome from "../../utils/setupFontAwesome";
import SettingsDialog from "../config/Dialog";
import { colorsToCss, darkBackgroundColors, lightBackgroundColors } from "../../utils/colors";
import getTheme from "./utils/getTheme";
import useHistory from "./hooks/useHistory";
import useCardContentRendering from "./hooks/useCardContentRendering";
import { DialogConfig } from "./utils/types";
import useCardHandler from "./hooks/useCardHandler";

const logger = Logger.create('YesYouKan: App');

declare var webviewApi: WebviewApi;

setupFontAwesome();

const updateNoteQueue = new AsyncActionQueue(100);

const theme = getTheme();

// We support anything that looks like a URL - we just want to send it back to the app via the
// `openItem` command.
const isSupportedUrl = (text:string) => {
	return !!text.match(/^[a-zA-Z\-]+:.+/);
}

interface AfterSetNoteAction {
	type: string;
	noteId: string;
}

export default () => {
	const [board, setBoard] = useState<Board>(emptyBoard());
	const [baseSettings, setBaseSettings] = useState<Settings>({});
	const ignoreNextBoardUpdate = useRef<boolean>(false);
	const [enabled, setEnabled] = useState<boolean>(false);
	const [isReadySent, setIsReadySent] = useState<boolean>(false);
	const [platform, setPlatform] = useState<Platform>('desktop');
	const afterSetNoteAction = useRef<AfterSetNoteAction|null>(null);
	const [dialogConfig, setDialogConfig] = useState<DialogConfig|null>(null);
	const [isDarkMode, setIsDarkMode] = useState(false);

	const effectiveBoardSettings = useMemo(() => {
		return {
			...baseSettings,
			...board.settings,
		}
	}, [board.settings, baseSettings]);

	const { history, pushUndo, clearUndo, onUndoBoard, onRedoBoard } = useHistory({ 
		board,
		setBoard,
	});

	const { cssStrings } = useCardContentRendering({
		board,
		setBoard,
		webviewApi,
	});

	const {
		editedCardIds,
		onCardEditorStart,
		onCardChange,
		onEditCardSettings,
		onDeleteCard,
		onCardEditorCancel,
		onAddCard,
	} = useCardHandler({
		board,
		pushUndo,
		setBoard,
		setDialogConfig,
		webviewApi,
	});

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

	const onEditStackSettings = useCallback<StackEventHandler>(async (event) => {
		const stack = findStack(board, event.stackId);
		setDialogConfig({
			title: 'Stack properties',
			settingItems: stackSettingItems,
			settings: { ...stack.settings },
			onSave: (newSettings: StackSettings) => {
				const newBoard = produce(board, draft => {
					const stackIndex = findStackIndex(draft, event.stackId);
					draft.stacks[stackIndex].settings = newSettings;
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

	const onStackDelete = useCallback<StackEventHandler>((event) => {
		pushUndo(board);

		const newBoard = produce(board, draft => {
			const stackIndex = findStackIndex(board, event.stackId);
			draft.stacks.splice(stackIndex, 1);
		});

		setBoard(newBoard);
	}, [board]);

	const renderStacks = () => {
		const dynamicWidth = effectiveBoardSettings.stackDynamicWidth ? board.stacks.length : 0;

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
				onEditSettings={onEditStackSettings}
				isLast={index === board.stacks.length - 1}
				dynamicWidth={dynamicWidth}
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
		const fn = async () => {
			const shouldUseDarkColors = await webviewApi.postMessage<boolean>({ type: 'shouldUseDarkColors' });
			setIsDarkMode(shouldUseDarkColors);
		}

		void fn();		
	}, []);

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

	const backgroundColors = useMemo(() => {
		return isDarkMode ? darkBackgroundColors : lightBackgroundColors;
	}, [isDarkMode]);

	const renderSettingsDialog = () => {
		if (!dialogConfig) return;

		return (
			<SettingsDialog
				title={dialogConfig.title}
				settingItems={dialogConfig.settingItems}
				settings={dialogConfig.settings}
				onClose={onSettingsDialogClose}
				onSave={dialogConfig.onSave}
				backgroundColor={backgroundColors}
				isDarkMode={isDarkMode}
			/>
		);
	}

	// A more natural way to do this would be to set the `style` prop on the stack element. However
	// doing this interfers with Beautiful DND and makes the stacks no longer draggable. It seems to
	// be fine with CSS being set via stylesheet though, so we do that here.
	const appStyle = useMemo(() => {
		const styles:string[] = [];

		if (!effectiveBoardSettings.stackDynamicWidth) {
			styles.push( `
				.stack {
					width: ${effectiveBoardSettings.stackWidth}px;
					max-width: ${effectiveBoardSettings.stackWidth}px;
				}
			`);
		} else {
			styles.push( `
				.stack {
					min-width: 10px;
				}
			`);
		}

		styles.push(colorsToCss(backgroundColors, 'background', 'background-color'));

		styles.push(cssStrings.join('\n'));

		return styles.join('\n\n');
	}, [effectiveBoardSettings.stackDynamicWidth, effectiveBoardSettings.stackWidth, backgroundColors, cssStrings]);

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