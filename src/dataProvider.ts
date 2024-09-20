import fakeRestDataProvider from "ra-data-fakerest";
import { CreateParams, DataProvider, DeleteManyParams, DeleteParams, GetListParams, GetManyParams, GetManyReferenceParams, GetOneParams, UpdateManyParams, UpdateParams } from "react-admin";
import { Post, getPostsByStatus } from "./posts";
import { Data } from "./utils/types";

declare var webviewApi: any;

interface MyDataProvider extends DataProvider {
	setData(data:Data): void;
}

export const newDataProvider = (data:Data):MyDataProvider => {
	const dataProvider = fakeRestDataProvider(data, true) as MyDataProvider;

	const base = { ...dataProvider };

	let data_:Data = data;

	dataProvider.setData = async (newData:Data) => {
		console.info('CURRENT LIST', await dataProvider.getList);

		dataProvider.deleteMany('posts', {
			ids: data_.posts.map(p => p.id),
		});

		console.info('SET DATA', newData);

		for (const post of newData.posts) {
			dataProvider.create('posts', {
				data: post,
			});
		}

		data_ = newData;
	};

	dataProvider.getList = async (resource: string, params: GetListParams) => {
		console.info('GET LIST', resource, data_[resource]);

		return {
			data: data_[resource],
			total: data_[resource].length,
		}
	};

	dataProvider.getOne = async (resource: string, params: GetOneParams) => {
		const output = { data: data_[resource].find(e => e.id === params.id) };
		console.info('GET ONE', resource, params);
		console.info('OUTPUT', await base.getOne(resource, params));
		return output;
	}

	dataProvider.getMany = async (resource: string, params: GetManyParams) => {
		console.info('GET MANY',await  base.getMany(resource, params));
		return base.getMany(resource, params);
	}

	dataProvider.getManyReference = async (resource: string, params: GetManyReferenceParams) => {
		console.info('GET MANY REF', resource, params, await base.getManyReference(resource, params));
		return base.getManyReference(resource, params);
	}

	dataProvider.create = async (resource: string, params: CreateParams) => {
		console.info('CREATE', resource, params);
		data_.posts.push(params.data as Post);
		return params.data as any;
	}

	dataProvider.update = async (resource: string, params: UpdateParams) => {
		const newData = data_[resource].slice();
		const index = newData.findIndex(e => e.id === params.id);
		if (index < 0) throw new Error('Could not find item: ' + resource + ': ' + JSON.stringify(params));
		newData[index] = params.data;
		data_[resource] = newData;
		return newData[index];
		// console.info('UPDATE', resource, params, base.update(resource, params));
		//return base.update(resource, params);
	}

	dataProvider.updateMany = async (resource: string, params: UpdateManyParams) => {
		console.info('UPDATE MANY', resource, params);
		return base.updateMany(resource, params);
	}

	dataProvider.delete = async (resource: string, params: DeleteParams) => {
		console.info('DELETE', resource, params);
		return base.delete(resource, params);
	}

	dataProvider.deleteMany = async (resource: string, params: DeleteManyParams) => {
		console.info('DELETE MANY', resource, params);
		return base.deleteMany(resource, params);
	}

	return dataProvider;
}



// const dp:DataProvider = {
//     // get a list of records based on sort, filter, and pagination
//     getList:    (resource: string, params: GetListParams) => {
// 		return data.posts
// 	},

//     // get a single record by id
//     getOne:     (resource, params) => Promise, 
//     // get a list of records based on an array of ids
//     getMany:    (resource, params) => Promise, 
//     // get the records referenced to another record, e.g. comments for a post
//     getManyReference: (resource, params) => Promise, 
//     // create a record
//     create:     (resource, params) => Promise, 
//     // update a record based on a patch
//     update:     (resource, params) => Promise, 
//     // update a list of records based on an array of ids and a common patch
//     updateMany: (resource, params) => Promise, 
//     // delete a record by id
//     delete:     (resource, params) => Promise, 
//     // delete a list of records based on an array of ids
//     deleteMany: (resource, params) => Promise, 
// }




// const baseDataProvider = fakeRestDataProvider(data, true);

// export interface MyDataProvider extends DataProvider {
// 	updatePostStatus: (
// 		// eslint-disable-next-line no-unused-vars
// 		source: Post,
// 		// eslint-disable-next-line no-unused-vars
// 		destination: {
// 			status: Post["status"];
// 			index?: number; // undefined if dropped after the last item
// 		}
// 	) => Promise<void>;
// }

// export const dataProvider: MyDataProvider = {
// 	...baseDataProvider,
// 	updatePostStatus: async (source, destination) => {
// 		const { data: unorderedPosts } = await dataProvider.getList<Post>("posts", {
// 			sort: { field: "index", order: "ASC" },
// 			pagination: { page: 1, perPage: 100 },
// 			filter: {},
// 		});

// 		const postsByStatus = getPostsByStatus(unorderedPosts);

// 		if (source.status === destination.status) {
// 			// moving post inside the same column

// 			const columnPosts = postsByStatus[source.status];
// 			const destinationIndex = destination.index ?? columnPosts.length + 1;

// 			if (source.index > destinationIndex) {
// 				// post moved up, eg
// 				// dest   src
// 				//  <------
// 				// [4, 7, 23, 5]

// 				await Promise.all([
// 					// for all posts between destinationIndex and source.index, increase the index
// 					...columnPosts
// 						.filter(
// 							(post) =>
// 								post.index >= destinationIndex && post.index < source.index
// 						)
// 						.map((post) =>
// 							dataProvider.update("posts", {
// 								id: post.id,
// 								data: { index: post.index + 1 },
// 								previousData: post,
// 							})
// 						),
// 					// for the post that was moved, update its index
// 					dataProvider.update("posts", {
// 						id: source.id,
// 						data: { index: destinationIndex },
// 						previousData: source,
// 					}),
// 				]);
// 			} else {
// 				// post moved down, e.g
// 				// src   dest
// 				//  ------>
// 				// [4, 7, 23, 5]

// 				await Promise.all([
// 					// for all posts between source.index and destinationIndex, decrease the index
// 					...columnPosts
// 						.filter(
// 							(post) =>
// 								post.index <= destinationIndex && post.index > source.index
// 						)
// 						.map((post) =>
// 							dataProvider.update("posts", {
// 								id: post.id,
// 								data: { index: post.index - 1 },
// 								previousData: post,
// 							})
// 						),
// 					// for the post that was moved, update its index
// 					dataProvider.update("posts", {
// 						id: source.id,
// 						data: { index: destinationIndex },
// 						previousData: source,
// 					}),
// 				]);
// 			}
// 		} else {
// 			// moving post across columns

// 			const sourceColumn = postsByStatus[source.status];
// 			const destinationColumn = postsByStatus[destination.status];
// 			const destinationIndex =
// 				destination.index ?? destinationColumn.length + 1;

// 			await Promise.all([
// 				// decrease index on the posts after the source index in the source columns
// 				...sourceColumn
// 					.filter((post) => post.index > source.index)
// 					.map((post) =>
// 						dataProvider.update("posts", {
// 							id: post.id,
// 							data: { index: post.index - 1 },
// 							previousData: post,
// 						})
// 					),
// 				// increase index on the posts after the destination index in the destination columns
// 				...destinationColumn
// 					.filter((post) => post.index >= destinationIndex)
// 					.map((post) =>
// 						dataProvider.update("posts", {
// 							id: post.id,
// 							data: { index: post.index + 1 },
// 							previousData: post,
// 						})
// 					),
// 				// change the dragged post to take the destination index and column
// 				dataProvider.update("posts", {
// 					id: source.id,
// 					data: {
// 						index: destinationIndex,
// 						status: destination.status,
// 					},
// 					previousData: source,
// 				}),
// 			]);
// 		}
// 	},
// };
