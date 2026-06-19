import { queryOptions } from "@tanstack/react-query";
import { getSongs } from "./music.functions";

export const songsQueryOptions = queryOptions({
  queryKey: ["songs"],
  queryFn: () => getSongs(),
  staleTime: 1000 * 60 * 30,
});
