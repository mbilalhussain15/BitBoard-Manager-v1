import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { BoardContext } from "../context/BoardContext";
import { ProjectContext } from "../context/ProjectContext";
import { projectService } from "../lib/api-utils";
import { useLocation } from "react-router-dom";

const pickIdFromPath = (pathname, key) => {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf(key);
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : null;
};

export const BoardProvider = ({ children }) => {
  const { currentProject } = useContext(ProjectContext);
  const location = useLocation();
  const routeProjectId = pickIdFromPath(location.pathname, "projects");

  const effectiveProjectId = routeProjectId || currentProject?._id || null;

  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [loading, setLoading] = useState(false);

  const lsKey = useMemo(() => {
    const pid = effectiveProjectId || "no-project";
    return `currentBoard:${pid}`;
  }, [effectiveProjectId]);

  useEffect(() => {
    const saved = localStorage.getItem(lsKey);
    setCurrentBoard(saved ? JSON.parse(saved) : null);
  }, [lsKey]);

  useEffect(() => {
    if (currentBoard) localStorage.setItem(lsKey, JSON.stringify(currentBoard));
    else localStorage.removeItem(lsKey);
  }, [currentBoard, lsKey]);

  // ✅ Memoize fetchBoards and use functional setCurrentBoard to avoid depending on currentBoard
  const fetchBoards = useCallback(async () => {
    if (!effectiveProjectId) {
      setBoards([]);
      setCurrentBoard(null);
      return [];
    }
    try {
      setLoading(true);
      const data = await projectService.fetchData(
        `/projects/${effectiveProjectId}/boards?_=${Date.now()}`
      );
      const list = Array.isArray(data) ? data : (data?.boards || []);
      setBoards(list);

      // functional update → no dependency on currentBoard
      setCurrentBoard(prev => {
        if (!list?.length) return null;
        const still = prev ? list.find(b => b._id === prev._id) : null;
        return still ?? list[0];
      });

      return list;
    } catch (err) {
      console.error("Error fetching boards:", err);
      setBoards([]);
      setCurrentBoard(null);
      return [];
    } finally {
      setLoading(false);
    }
  }, [effectiveProjectId]); // projectService is a module import → stable

  // ✅ Depend on the memoized function
  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  return (
    <BoardContext.Provider
      value={{ boards, setBoards, currentBoard, setCurrentBoard, loading, refetchBoards: fetchBoards }}
    >
      {children}
    </BoardContext.Provider>
  );
};
