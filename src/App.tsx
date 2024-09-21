import * as React from "react";
import { useCallback, useState } from "react";
import { State } from "./utils/types";
import StackViewer from "./gui/StackViewer";
import { DragDropContext, OnDragEndResponder } from "@hello-pangea/dnd";
import {produce} from "immer"

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
		for (const stack of state.board.stacks) {
			output.push(<StackViewer key={stack.id} value={stack}/>);
		}
		return output;
	}

	const onDragEnd:OnDragEndResponder = useCallback((result) => {
		const { destination, source } = result;

		if (!destination) return;
		if (destination.droppableId === source.droppableId && destination.index === source.index) return
		
		const newState = produce(state, draft => {
			const stack = draft.board.stacks.find(s => s.id === source.droppableId);
			const removed = stack.cards.splice(source.index, 1);
			stack.cards.splice(destination.index, 0, removed[0]);
		});

		console.info('NEW STATE', newState);

		setState(newState);
	}, []);

	return (
		<div>
			<div className="stacks">
				<DragDropContext onDragEnd={onDragEnd}>
					{renderStacks()}
				</DragDropContext>
			</div>
		</div>		
	);
}