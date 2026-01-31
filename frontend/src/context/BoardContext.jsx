import { createContext } from "react";

export const BoardContext = createContext({
  boards: [],
  setBoards: () => {},
  currentBoard: null,
  setCurrentBoard: () => {},
  loading: false,
  refetchBoards: async () => [],
});