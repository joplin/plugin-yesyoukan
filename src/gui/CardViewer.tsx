import { Draggable } from "@hello-pangea/dnd";
import * as React from "react";
import { useMemo } from "react";
import { Card, Stack } from "src/utils/types";
import * as MarkdownIt from 'markdown-it';

interface Props {
	value: Card;
	index: number;
	isLast: boolean;
}

const markdownIt = new MarkdownIt();

export default (props:Props) => {
	const card = props.value;

	const bodyHtml = useMemo(() => {
		return markdownIt.render(props.value.body);
	}, [props.value.body]);

	return (
		<Draggable draggableId={card.id} index={props.index}>
			{(provided, snapshot) => {
				const classes = ['card'];
				if (snapshot.isDragging) classes.push('is-dragging');
				if (props.isLast) classes.push('is-last');
				return (
					<div className={classes.join(' ')} {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
						<h3 className="title">{card.title}</h3>
						<p className="body" dangerouslySetInnerHTML={{ __html: bodyHtml} }></p>
					</div>
				);
			}}
		</Draggable>
	);
}