import * as React from "react";
import { Stack } from "src/utils/types";
import CardViewer from "./CardViewer";
import { Droppable } from "@hello-pangea/dnd";

interface Props {
	value: Stack;
}

export default (props:Props) => {
	const renderCards = () => {
		const output:React.JSX.Element[] = [];
		for (let [index, card] of props.value.cards.entries()) {
			output.push(<CardViewer index={index} key={card.id} value={card}/>);
		}
		return output;
	}

	return (
		<div className="stack">
			<h2>{props.value.title}</h2>
			<Droppable droppableId={props.value.id}>
				{(provided) => (
					<div className="cards" {...provided.droppableProps} ref={provided.innerRef}>
						{renderCards()}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</div>
	);
}