import React, { useContext } from "react";
import { BoardContext } from "../../context/BoardContext";


export function useStatusOptions() {
  const { currentBoard } = useContext(BoardContext);
  // console.log("currentBoardData 1=", currentBoardData);
  // Ensure currentBoardData and its columns are available
  if (!currentBoard || !currentBoard.columns) {
    return [null]; // Return null or a fallback value if data is not ready
  }


  const statusOptionElements = currentBoard.columns?.map(
    (option, index) => (
      <option key={index} value={option.columnName}>
        {option.columnName}{" "}
      </option>
    )
  );

  return [statusOptionElements];
}
