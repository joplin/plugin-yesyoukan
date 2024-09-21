import * as React from "react";
import { useCallback, useState, useEffect } from "react";
import { Board, IpcMessage, State, WebviewApi } from "./utils/types";
import StackViewer from "./gui/StackViewer";
import { DragDropContext, Droppable, OnDragEndResponder } from "@hello-pangea/dnd";
import {current, produce} from "immer"
import uuid from "./utils/uuid";
import { boardsEqual, parseNote, serializeBoard } from "./utils/noteParser";
import AsyncActionQueue from "./utils/AsyncActionQueue";

declare var webviewApi: WebviewApi;

const updateNoteQueue = new AsyncActionQueue(100);

export const App = () => {
	const [board, setBoard] = useState<Board>({ stacks: [] });

	const renderStacks = () => {
		const output:React.JSX.Element[] = [];
		for (let [index, stack] of board.stacks.entries()) {
			output.push(<StackViewer key={stack.id} value={stack} index={index}/>);
		}
		return output;
	}

	useEffect(() => {
		const fn = async() => {
			const noteBody = await webviewApi.postMessage<string>({ type: 'getNoteBody' });
			const newBoard = parseNote(noteBody);
			setBoard(newBoard);
		}

		void fn();
	}, []);

	useEffect(() => {
		webviewApi.onMessage((event) => {
			const message = event.message;
			if (message.type === 'setNoteBody') {
				const newBoard = parseNote(message.value);
				setBoard(current => {
					if (boardsEqual(current, newBoard)) {
						console.info('Board has not changed - skipping update');
						return current;
					}
					console.info('Boad has changed - updating');
					return newBoard;
				});
			} else {
				throw new Error('Unknown message:' + JSON.stringify(message));
			}
		});
	}, []);

	useEffect(() => {
		updateNoteQueue.push(async () => {
			const noteBody = serializeBoard(board);
			await webviewApi.postMessage({ type: 'setNoteBody', value: noteBody });	
		});
	}, [board]);

	const onDragEnd:OnDragEndResponder = useCallback((result) => {
		const { destination, source, type } = result;

		if (!destination) return;
		if (destination.droppableId === source.droppableId && destination.index === source.index) return

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

	return (
		<div className="app">
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
	);
}