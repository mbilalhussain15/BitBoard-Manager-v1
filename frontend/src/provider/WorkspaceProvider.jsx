import React, { useState, useEffect, useCallback } from "react";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { workspaceService } from "../lib/api-utils";
import { useLocation } from "react-router-dom";

const pickIdFromPath = (pathname, key) => {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf(key);
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : null;
};

export const WorkspaceProvider = ({ children }) => {
  const location = useLocation();
  const routeWorkspaceId = pickIdFromPath(location.pathname, "workspaces");

  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(() => {
    const saved = localStorage.getItem("currentWorkspace");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // ✅ memoized fetch; selection via functional update
  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      const data = await workspaceService.fetchData("/workspaces");
      setWorkspaces(data);

      setCurrentWorkspace(prev => {
        if (!data.length) return null;
        if (routeWorkspaceId) {
          const byRoute = data.find(w => w._id === routeWorkspaceId);
          return byRoute ?? data[0];
        }
        const still = prev ? data.find(w => w._id === prev._id) : null;
        return still ?? data[0];
      });

      return data;
    } catch (err) {
      console.error("Error fetching workspaces:", err);
      setCurrentWorkspace(null);
      return [];
    } finally {
      setLoading(false);
    }
  }, [routeWorkspaceId]);

  // ✅ depend on memoized fetch
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // persist selection
  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem("currentWorkspace", JSON.stringify(currentWorkspace));
    } else {
      localStorage.removeItem("currentWorkspace");
    }
  }, [currentWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        setWorkspaces,
        currentWorkspace,
        setCurrentWorkspace,
        loading,
        refetchWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
