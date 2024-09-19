import fakeRestDataProvider from "ra-data-fakerest";
import { DataProvider } from "react-admin";
import { Post, getPostsByStatus } from "./posts";

const data = {
  "posts": [
    {
      "id": 0,
      "title": "Post 1",
      "content": "lorem ipsum dolor sit amet",
      "status": "draft",
      "index": 0
    },
    {
      "id": 1,
      "title": "Post 2",
      "content": "consectetur adipiscing elit",
      "status": "to_review",
      "index": 0
    },
    {
      "id": 2,
      "title": "Post 3",
      "content": "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
      "status": "published",
      "index": 0
    },
    {
      "id": 3,
      "title": "Post 4",
      "content": "Ut enim ad minim veniam",
      "status": "to_publish",
      "index": 0
    },
    {
      "id": 4,
      "title": "Post 5",
      "content": "quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat",
      "status": "draft",
      "index": 1
    },
    {
      "id": 5,
      "title": "Post 6",
      "content": "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur",
      "status": "draft",
      "index": 2
    },
    {
      "id": 6,
      "title": "Post 7",
      "content": "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
      "status": "to_be_fixed",
      "index": 0
    },
    {
      "id": 7,
      "title": "Post 8",
      "content": "Sed ut perspiciatis unde",
      "status": "published",
      "index": 1
    },
    {
      "id": 8,
      "title": "Post 9",
      "content": "iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam",
      "status": "published",
      "index": 2
    },
    {
      "id": 9,
      "title": "Post 10",
      "content": "eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo",
      "status": "to_review",
      "index": 1
    },
    {
      "id": 10,
      "title": "Post 11",
      "content": "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit",
      "status": "to_publish",
      "index": 1
    },
    {
      "id": 11,
      "title": "Post 12",
      "content": "sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt",
      "status": "to_review",
      "index": 2
    }
  ],
  "comments": [
    {
      "id": 0,
      "postId": 0,
      "content": "Comment 1"
    },
    {
      "id": 1,
      "postId": 0,
      "content": "Comment 2"
    },
    {
      "id": 2,
      "postId": 1,
      "content": "Comment 3"
    },
    {
      "id": 3,
      "postId": 1,
      "content": "Comment 4"
    },
    {
      "id": 4,
      "postId": 2,
      "content": "Comment 5"
    },
    {
      "id": 5,
      "postId": 2,
      "content": "Comment 6"
    },
    {
      "id": 6,
      "postId": 3,
      "content": "Comment 7"
    },
    {
      "id": 7,
      "postId": 3,
      "content": "Comment 8"
    },
    {
      "id": 8,
      "postId": 3,
      "content": "Comment 9"
    },
    {
      "id": 9,
      "postId": 4,
      "content": "Comment 10"
    },
    {
      "id": 10,
      "postId": 4,
      "content": "Comment 11"
    }
  ]
};

const baseDataProvider = fakeRestDataProvider(data, true);

export interface MyDataProvider extends DataProvider {
  updatePostStatus: (
    // eslint-disable-next-line no-unused-vars
    source: Post,
    // eslint-disable-next-line no-unused-vars
    destination: {
      status: Post["status"];
      index?: number; // undefined if dropped after the last item
    }
  ) => Promise<void>;
}

export const dataProvider: MyDataProvider = {
  ...baseDataProvider,
  updatePostStatus: async (source, destination) => {
    const { data: unorderedPosts } = await dataProvider.getList<Post>("posts", {
      sort: { field: "index", order: "ASC" },
      pagination: { page: 1, perPage: 100 },
      filter: {},
    });

    const postsByStatus = getPostsByStatus(unorderedPosts);

    if (source.status === destination.status) {
      // moving post inside the same column

      const columnPosts = postsByStatus[source.status];
      const destinationIndex = destination.index ?? columnPosts.length + 1;

      if (source.index > destinationIndex) {
        // post moved up, eg
        // dest   src
        //  <------
        // [4, 7, 23, 5]

        await Promise.all([
          // for all posts between destinationIndex and source.index, increase the index
          ...columnPosts
            .filter(
              (post) =>
                post.index >= destinationIndex && post.index < source.index
            )
            .map((post) =>
              dataProvider.update("posts", {
                id: post.id,
                data: { index: post.index + 1 },
                previousData: post,
              })
            ),
          // for the post that was moved, update its index
          dataProvider.update("posts", {
            id: source.id,
            data: { index: destinationIndex },
            previousData: source,
          }),
        ]);
      } else {
        // post moved down, e.g
        // src   dest
        //  ------>
        // [4, 7, 23, 5]

        await Promise.all([
          // for all posts between source.index and destinationIndex, decrease the index
          ...columnPosts
            .filter(
              (post) =>
                post.index <= destinationIndex && post.index > source.index
            )
            .map((post) =>
              dataProvider.update("posts", {
                id: post.id,
                data: { index: post.index - 1 },
                previousData: post,
              })
            ),
          // for the post that was moved, update its index
          dataProvider.update("posts", {
            id: source.id,
            data: { index: destinationIndex },
            previousData: source,
          }),
        ]);
      }
    } else {
      // moving post across columns

      const sourceColumn = postsByStatus[source.status];
      const destinationColumn = postsByStatus[destination.status];
      const destinationIndex =
        destination.index ?? destinationColumn.length + 1;

      await Promise.all([
        // decrease index on the posts after the source index in the source columns
        ...sourceColumn
          .filter((post) => post.index > source.index)
          .map((post) =>
            dataProvider.update("posts", {
              id: post.id,
              data: { index: post.index - 1 },
              previousData: post,
            })
          ),
        // increase index on the posts after the destination index in the destination columns
        ...destinationColumn
          .filter((post) => post.index >= destinationIndex)
          .map((post) =>
            dataProvider.update("posts", {
              id: post.id,
              data: { index: post.index + 1 },
              previousData: post,
            })
          ),
        // change the dragged post to take the destination index and column
        dataProvider.update("posts", {
          id: source.id,
          data: {
            index: destinationIndex,
            status: destination.status,
          },
          previousData: source,
        }),
      ]);
    }
  },
};
