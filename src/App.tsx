import * as React from "react";
import { useCallback, useState } from "react";
import { State } from "./utils/types";
import StackViewer from "./gui/StackViewer";
import { DragDropContext, Droppable, OnDragEndResponder } from "@hello-pangea/dnd";
import {current, produce} from "immer"

// declare var webviewApi: any;

const uuidgen = () => {
	return Math.round(Math.random() * 100000).toString() + '_' + Date.now().toString();
}

const defaultState:State = {
	board: {
		stacks: [
			{
				id: uuidgen(),
				title: 'Draft',
				cards: [
					{
						id: uuidgen(),
						title: 'Post 1',
						body: 'Content 1',
					},
					{
						id: uuidgen(),
						title: 'Post 2',
						body: 'Content 2',
					},
				]
			},

			{
				id: uuidgen(),
				title: 'To review',
				cards: [
					{
						id: uuidgen(),
						title: 'Post 3',
						body: 'Content 3',
					},
				]
			},

			{
				id: uuidgen(),
				title: 'To publish',
				cards: [
					{
						id: uuidgen(),
						title: 'Post 4',
						body: 'Content 4',
					},
				]
			},


			{
				id: uuidgen(),
				title: 'Completed',
				cards: []
			},
		],
	},
};

export const App = () => {
	const [state, setState] = useState<State>(defaultState);

	const renderStacks = () => {
		const output:React.JSX.Element[] = [];
		for (let [index, stack] of state.board.stacks.entries()) {
			output.push(<StackViewer key={stack.id} value={stack} index={index}/>);
		}
		return output;
	}

	const onDragEnd:OnDragEndResponder = useCallback((result) => {
		const { destination, source, type } = result;

		if (!destination) return;
		if (destination.droppableId === source.droppableId && destination.index === source.index) return

		if (type === 'card') {
			const newState = produce(state, draft => {
				const sourceStack = draft.board.stacks.find(s => s.id === source.droppableId);
				const destinationStack = draft.board.stacks.find(s => s.id === destination.droppableId);
				const removed = sourceStack.cards.splice(source.index, 1);
				destinationStack.cards.splice(destination.index, 0, removed[0]);
			});

			setState(newState);
		} else if (type === "column") {
			const newState = produce(state, draft => {
				const removed = draft.board.stacks.splice(source.index, 1);
				draft.board.stacks.splice(destination.index, 0, removed[0]);
			});

			setState(newState);
		} else {
			throw new Error('Unknown type: ' + type);
		}
	}, [state]);

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