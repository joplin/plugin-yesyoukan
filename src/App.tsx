import * as React from "react";
import { useCallback } from "react";
import { State } from "./utils/types";
import StackViewer from "./gui/StackViewer";
import { DragDropContext, OnDragEndResponder } from "@hello-pangea/dnd";
// declare var webviewApi: any;

const uuidgen = () => {
	return Math.round(Math.random() * 100000).toString() + '_' + Date.now().toString();
}

const state:State = {
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
	const renderStacks = () => {
		const output:React.JSX.Element[] = [];
		for (const stack of state.board.stacks) {
			output.push(<StackViewer key={stack.id} value={stack}/>);
		}
		return output;
	}

	const onDragEnd:OnDragEndResponder = useCallback(() => {
		// TODO
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