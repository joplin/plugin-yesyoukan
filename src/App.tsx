import * as React from "react";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { Board, WebviewApi, emptyBoard } from "./utils/types";
import StackViewer, { AddCardEventHandler, DeleteEventHandler, TitleChangeEventHandler } from "./gui/StackViewer";
import { DragDropContext, Droppable, OnDragEndResponder } from "@hello-pangea/dnd";
import { produce} from "immer"
import { boardsEqual, noteIsBoard, parseNote, serializeBoard } from "./utils/noteParser";
import AsyncActionQueue from "./utils/AsyncActionQueue";
import { EditorSubmitHandler as CardChangeEventHandler, DeleteEventHandler as CardDeleteEventHandler, EditorCancelHandler, EditorStartHandler } from "./gui/CardViewer";
import { findCardIndex, findStackIndex } from "./utils/board";
import { ThemeProvider, createTheme } from "@mui/material";
import Toolbar from './gui/Toolbar';
import { Props as ButtonProps } from './gui/Button';
import uuid from "./utils/uuid";
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('YesYouKan: App');

declare var webviewApi: WebviewApi;

const updateNoteQueue = new AsyncActionQueue(100);

let computedStyle_:CSSStyleDeclaration|null = null;
const getCssVariable = (variableName: string) => {
	if (!computedStyle_) computedStyle_ = getComputedStyle(document.documentElement);
	return computedStyle_.getPropertyValue(variableName).trim();
}

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
		divider: getCssVariable('--joplin-divider-color') ,
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
	},
});

interface HistoryItem {
	board: Board;
}

interface History {
	undo: HistoryItem[];
	redo: HistoryItem[];
}

const emptyHistory = ():History => {
	return {
		undo: [],
		redo: [],
	}
}

export const App = () => {
	const [board, setBoard] = useState<Board>(emptyBoard());
	const [history, setHistory] = useState<History>(emptyHistory);
	const ignoreNextBoardUpdate = useRef<boolean>(false);
	const [editedCardIds, setEditedCardIds] = useState<string[]>([]);
	const [enabled, setEnabled] = useState<boolean>(false);

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

	const onDeleteCard = useCallback<CardDeleteEventHandler>((event) => {
		pushUndo(board);

		const newBoard = produce(board, draft => {
			const [stackIndex, cardIndex] = findCardIndex(draft, event.cardId);
			draft.stacks[stackIndex].cards.splice(cardIndex, 1);
		});

		setBoard(newBoard);
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
				onAddCard={onAddCard}
				onDeleteCard={onDeleteCard}
				key={stack.id}
				value={stack}
				index={index}
				editedCardIds={editedCardIds}
			/>);
		}
		return output;
	}

	useEffect(() => {
		const fn = async() => {
			const noteBody = await webviewApi.postMessage<string>({ type: 'getNoteBody' });
			logger.info('NOTE IS BOARD', noteBody);
			logger.info('NOTE IS BOARD', noteIsBoard(noteBody));
			if (!noteIsBoard(noteBody)) {
				setEnabled(false);
				return;
			}
			const newBoard = await parseNote(noteBody);
			setEnabled(true);
			setBoard(newBoard);
		}

		void fn();
	}, []);

	useEffect(() => {
		webviewApi.onMessage(async (event) => {
			const message = event.message;

			logger.info('ZEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',enabled);

			if (!enabled) return;

			if (message.type === 'setNoteBody') {
				const newBoard = await parseNote(message.value);
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
				throw new Error('Unknown message:' + JSON.stringify(message));
			}
		});
	}, [enabled]);

	useEffect(() => {
		if (!ignoreNextBoardUpdate.current) {
			updateNoteQueue.push(async () => {
				const noteBody = serializeBoard(board);
				await webviewApi.postMessage({ type: 'setNoteBody', value: noteBody });	
			});
		}
		ignoreNextBoardUpdate.current = false;
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
				icon: 'fas fa-undo',
				disabled: !history.undo.length,
				title: 'Undo',
				onClick: () => {
					onUndoBoard();
				},
			},

			{
				name: 'redo',
				icon: 'fas fa-redo',
				disabled: !history.redo.length,
				title: 'Redo',
				onClick: () => {
					onRedoBoard();
				},
			},

			{
				name: 'newStack',
				icon: 'fas fa-plus',
				title: 'New stack',
				onClick: () => {
					onAddStack();
				},
			},
		];		
		return output;
	}, [onUndoBoard, onRedoBoard, history.undo.length, history.redo.length, onAddStack]);

	return (
		<ThemeProvider theme={theme}>
			<div className="app">
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