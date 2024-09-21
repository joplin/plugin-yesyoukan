import { Draggable } from "@hello-pangea/dnd";
import * as React from "react";
import { Card, Stack } from "src/utils/types";

interface Props {
	value: Card;
	index: number;
}

export default (props:Props) => {
	const card = props.value;

	return (
		<Draggable draggableId={card.id} index={props.index}>
			{(provided, snapshot) => {
				const classes = ['card'];
				if (snapshot.isDragging) classes.push('is-dragging');
				return (
					<div className={classes.join(' ')} {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
						<h3>{card.title}</h3>
						<p>{card.body}</p>
					</div>
				);
			}}
		</Draggable>
	);
}