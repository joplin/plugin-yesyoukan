import * as React from "react";

import { DragDropContext, OnDragEndResponder } from "@hello-pangea/dnd";
import { Box } from "@mui/material";
import { isEqual } from "lodash";
import { useEffect, useState } from "react";
import { useDataProvider, useListContext } from "react-admin";
import { useMutation } from "react-query";
import type { Post } from ".";
import { PostsByStatus, getPostsByStatus, statuses } from ".";
import { MyDataProvider } from "../dataProvider";
import { PostColumn } from "./PostColumn";

export const PostListContent = () => {
	const { data: unorderedPosts, isLoading, refetch } = useListContext<Post>();
	const dataProvider = useDataProvider<MyDataProvider>();

	const [postsByStatus, setPostsByStatus] = useState<PostsByStatus>(
		getPostsByStatus([])
	);

	useEffect(() => {
		if (unorderedPosts) {
			const newPostsByStatus = getPostsByStatus(unorderedPosts);
			if (!isEqual(newPostsByStatus, postsByStatus)) {
				setPostsByStatus(newPostsByStatus);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [unorderedPosts]);

	// const mutation = useMutation<
	// 	void,
	// 	Error,
	// 	{
	// 		source: Parameters<MyDataProvider["updatePostStatus"]>[0];
	// 		destination: Parameters<MyDataProvider["updatePostStatus"]>[1];
	// 	}
	// >(
	// 	({ source, destination }) =>
	// 		dataProvider.updatePostStatus(source, destination),
	// 	{ onSettled: () => refetch() }
	// );

	if (isLoading) return null;

	const onDragEnd: OnDragEndResponder = (result) => {
		const { destination, source } = result;

		if (!destination) {
			return;
		}

		if (
			destination.droppableId === source.droppableId &&
			destination.index === source.index
		) {
			return;
		}

		const sourceStatus = source.droppableId as Post["status"];
		const destinationStatus = destination.droppableId as Post["status"];
		const sourcePost = postsByStatus[sourceStatus][source.index]!;
		const destinationPost = postsByStatus[destinationStatus][
			destination.index
		] ?? {
			status: destinationStatus,
			index: undefined, // undefined if dropped after the last item
		};

		// compute local state change synchronously
		const newPostsByStatus = updatePostStatusLocal(
			sourcePost,
			{ status: sourceStatus, index: source.index },
			{ status: destinationStatus, index: destination.index },
			postsByStatus
		);
		console.info('PPPPPPPPPPPPPPPP', newPostsByStatus);
		setPostsByStatus(
			newPostsByStatus
		);

		// trigger the mutation to persist the changes
		mutation.mutateAsync({
			source: sourcePost,
			destination: destinationPost,
		});
	};

	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<Box display="flex">
				{statuses.map((status) => (
					<PostColumn
						status={status}
						posts={postsByStatus[status]}
						key={status}
					/>
				))}
			</Box>
		</DragDropContext>
	);
};

const updatePostStatusLocal = (
	sourcePost: Post,
	source: { status: Post["status"]; index: number },
	destination: {
		status: Post["status"];
		index?: number; // undefined if dropped after the last item
	},
	postsByStatus: PostsByStatus
) => {
	if (source.status === destination.status) {
		// moving deal inside the same column
		const column = postsByStatus[source.status];
		column.splice(source.index, 1);
		column.splice(destination.index ?? column.length + 1, 0, sourcePost);
		return {
			...postsByStatus,
			[destination.status]: column,
		};
	} else {
		// moving deal across columns
		const sourceColumn = postsByStatus[source.status];
		const destinationColumn = postsByStatus[destination.status];
		sourceColumn.splice(source.index, 1);
		destinationColumn.splice(
			destination.index ?? destinationColumn.length + 1,
			0,
			sourcePost
		);
		return {
			...postsByStatus,
			[source.status]: sourceColumn,
			[destination.status]: destinationColumn,
		};
	}
};
