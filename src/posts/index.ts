export * from "./statuses";
export * from "./PostCard";
export * from "./PostColumn";
export * from "./PostList";
export * from "./PostListContent";

export interface Post {
  id: number;
  title: string;
  content: string;
  status: "draft" | "to_review" | "to_be_fixed" | "to_publish" | "published";
  index: number;
}
