import * as React from "react";

import { List, SearchInput } from "react-admin";
import { useMediaQuery, Typography, Theme } from "@mui/material";

import { PostListContent } from ".";

const postFilters = [
  // eslint-disable-next-line react/jsx-key
  <SearchInput source="q" alwaysOn />,
];

export const PostList = () => {
  const isSmall = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  return (
    <List
      filters={postFilters}
      perPage={100}
      sort={{ field: "index", order: "ASC" }}
      pagination={false}
      component="div"
    >
      {<PostListContent />}
    </List>
  );
};

const FallbackForMobile = () => (
  <Typography mt={3} align="center">
    The Kanban board demo is not available on mobile
  </Typography>
);
