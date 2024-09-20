import * as React from "react";
import { createContext, useState, useEffect } from 'react';
import { Admin, Resource, ListGuesser, EditGuesser, ShowGuesser, DataProvider, useRefresh } from "react-admin";
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'

import { newDataProvider } from "./dataProvider";
import { PostList } from "./posts";
declare var webviewApi: any;


// const data:Data = {
// 	"posts": [
// 		{
// 			"id": '0',
// 			"title": "Post 1",
// 			"content": "lorem ipsum dolor sit amet",
// 			"status": "draft",
// 			"index": 0
// 		},
// 		{
// 			"id": '1',
// 			"title": "Post 2",
// 			"content": "consectetur adipiscing elit",
// 			"status": "to_review",
// 			"index": 0
// 		},
// 		{
// 			"id": '2',
// 			"title": "Post 3",
// 			"content": "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
// 			"status": "published",
// 			"index": 0
// 		},
// 		{
// 			"id": '3',
// 			"title": "Post 4",
// 			"content": "Ut enim ad minim veniam",
// 			"status": "to_publish",
// 			"index": 0
// 		},
// 		{
// 			"id": '4',
// 			"title": "Post 5",
// 			"content": "quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat",
// 			"status": "draft",
// 			"index": 1
// 		},
// 		{
// 			"id": '5',
// 			"title": "Post 6",
// 			"content": "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur",
// 			"status": "draft",
// 			"index": 2
// 		},
// 		{
// 			"id": '6',
// 			"title": "Post 7",
// 			"content": "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
// 			"status": "to_be_fixed",
// 			"index": 0
// 		},
// 		{
// 			"id": '7',
// 			"title": "Post 8",
// 			"content": "Sed ut perspiciatis unde",
// 			"status": "published",
// 			"index": 1
// 		},
// 		{
// 			"id": '8',
// 			"title": "Post 9",
// 			"content": "iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam",
// 			"status": "published",
// 			"index": 2
// 		},
// 		{
// 			"id": '9',
// 			"title": "Post 10",
// 			"content": "eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo",
// 			"status": "to_review",
// 			"index": 1
// 		},
// 		{
// 			"id": '10',
// 			"title": "Post 11",
// 			"content": "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit",
// 			"status": "to_publish",
// 			"index": 1
// 		},
// 		{
// 			"id": '11',
// 			"title": "Post 12",
// 			"content": "sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt",
// 			"status": "to_review",
// 			"index": 2
// 		}
// 	],
// 	// "comments": [
// 	// 	{
// 	// 		"id": '0',
// 	// 		"postId": 0,
// 	// 		"content": "Comment 1"
// 	// 	},
// 	// 	{
// 	// 		"id": '1',
// 	// 		"postId": 0,
// 	// 		"content": "Comment 2"
// 	// 	},
// 	// 	{
// 	// 		"id": '2',
// 	// 		"postId": 1,
// 	// 		"content": "Comment 3"
// 	// 	},
// 	// 	{
// 	// 		"id": '3',
// 	// 		"postId": 1,
// 	// 		"content": "Comment 4"
// 	// 	},
// 	// 	{
// 	// 		"id": '4',
// 	// 		"postId": 2,
// 	// 		"content": "Comment 5"
// 	// 	},
// 	// 	{
// 	// 		"id": '5',
// 	// 		"postId": 2,
// 	// 		"content": "Comment 6"
// 	// 	},
// 	// 	{
// 	// 		"id": '6',
// 	// 		"postId": 3,
// 	// 		"content": "Comment 7"
// 	// 	},
// 	// 	{
// 	// 		"id": '7',
// 	// 		"postId": 3,
// 	// 		"content": "Comment 8"
// 	// 	},
// 	// 	{
// 	// 		"id": '8',
// 	// 		"postId": 3,
// 	// 		"content": "Comment 9"
// 	// 	},
// 	// 	{
// 	// 		"id": '9',
// 	// 		"postId": 4,
// 	// 		"content": "Comment 10"
// 	// 	},
// 	// 	{
// 	// 		"id": '10',
// 	// 		"postId": 4,
// 	// 		"content": "Comment 11"
// 	// 	}
// 	// ]
// };

const queryClient = new QueryClient();


const defaultContextValue = {};

export const AppContent = createContext(defaultContextValue);

const InnerApp = () => {
	const [sharedData, setSharedData] = useState({ user: 'admin', theme: 'dark' });
	const dataProvider = newDataProvider({ posts: [] });
	// const [dataProvider, setDataProvider] = useState<DataProvider>(newDataProvider({
	// 	posts: [],
	// }));

	const refresh = useRefresh();

	useEffect(() => {
		const exec = async () => {
			const response = await webviewApi.postMessage('getNoteBody');
			console.info('RESPONSEEEEEEEEEEEEEEEE', response);

			setTimeout(async () => {
				console.info('SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS');
				// void dataProvider.setData(
				// 	{
				// 		posts: [
				// 			{
				// 				"id": '0',
				// 				"title": "Post 1",
				// 				"content": "lorem ipsum dolor sit amet",
				// 				"status": "draft",
				// 				"index": 0
				// 			},
				// 		],
				// 	}
				// );

				await dataProvider.create('posts',
					{
						data: {
							"id": '0',
							"title": "Post 1",
							"content": "lorem ipsum dolor sit amet",
							"status": "draft",
							"index": 0
						},
					}
				);

				refresh();

				// setTimeout(() => {
				// 	refresh();
				// }, 1000);
			}, 3000);
		};

		void exec();
	}, []);

	return (
		<AppContent.Provider value={{ sharedData, setSharedData }}>
			<Admin dataProvider={dataProvider}>
				<Resource
					name="posts"
					list={PostList}
					edit={EditGuesser}
					show={ShowGuesser}
				/>
			</Admin>
		</AppContent.Provider>
	);
}

export const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<InnerApp/>
		</QueryClientProvider>	
	);
}