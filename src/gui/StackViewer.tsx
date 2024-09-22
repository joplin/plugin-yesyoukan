import * as React from "react";
import { Stack } from "src/utils/types";
import CardViewer, { ChangeEventHandler as CarcChangeEventHandler } from "./CardViewer";
import { Draggable, Droppable } from "@hello-pangea/dnd";

interface Props {
	value: Stack;
	index: number;
	onCardChange: CarcChangeEventHandler;
}

export default (props:Props) => {
	const renderCards = () => {
		const output:React.JSX.Element[] = [];
		for (let [index, card] of props.value.cards.entries()) {
			output.push(<CardViewer onChange={props.onCardChange} isLast={index === props.value.cards.length - 1} index={index} key={card.id} value={card}/>);
		}
		return output;
	}

	return (
		<Draggable draggableId={props.value.id} index={props.index}>
			{(provided) => {
				return (
					<div className="stack" {...provided.draggableProps} ref={provided.innerRef}>
						<h2 className="title" {...provided.dragHandleProps}>{props.value.title}</h2>
						<Droppable droppableId={props.value.id} type="card">
							{(provided, snapshot) => {
								const classes = ['cards'];
								if (snapshot.isDraggingOver) classes.push('-dragging-over');
								return (
									<div className={classes.join(' ')} {...provided.droppableProps} ref={provided.innerRef}>
										{renderCards()}
										{provided.placeholder}
									</div>
								);
							}}
						</Droppable>
					</div>
				);
			}}
		</Draggable>
	);
}