import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { ProjectContext } from "../context/ProjectContext";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { workspaceService } from "../lib/api-utils";
import { useLocation } from "react-router-dom";

const pickIdFromPath = (pathname, key) => {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf(key);
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : null;
};

export const ProjectProvider = ({ children }) => {
  const { currentWorkspace } = useContext(WorkspaceContext);
  const location = useLocation();
  const routeWorkspaceId = pickIdFromPath(location.pathname, "workspaces");
  const routeProjectId = pickIdFromPath(location.pathname, "projects");

  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const lsKey = useMemo(() => {
    const wid = currentWorkspace?._id || "no-workspace";
    return `currentProject:${wid}`;
  }, [currentWorkspace?._id]);

  // hydrate from LS
  useEffect(() => {
    const saved = localStorage.getItem(lsKey);
    setCurrentProject(saved ? JSON.parse(saved) : null);
  }, [lsKey]);

  // persist to LS
  useEffect(() => {
    if (currentProject) localStorage.setItem(lsKey, JSON.stringify(currentProject));
    else localStorage.removeItem(lsKey);
  }, [currentProject, lsKey]);

  // ✅ memoized fetch with functional setState (no stale deps)
  const fetchProjects = useCallback(async () => {
    const effectiveWorkspaceId = routeWorkspaceId || currentWorkspace?._id;
    if (!effectiveWorkspaceId) {
      setProjects([]);
      setCurrentProject(null);
      return [];
    }
    try {
      setLoading(true);
      const data = await workspaceService.fetchData(
        `/workspaces/${effectiveWorkspaceId}/projects?_=${Date.now()}`
      );
      const list = Array.isArray(data) ? data : (data?.projects || []);
      setProjects(list);

      setCurrentProject(prev => {
        if (!list.length) return null;
        if (routeProjectId) {
          const byRoute = list.find(p => p._id === routeProjectId);
          return byRoute ?? list[0];
        }
        const still = prev ? list.find(p => p._id === prev._id) : null;
        return still ?? list[0];
      });

      return list;
    } catch (err) {
      console.error("Error fetching projects:", err);
      setProjects([]);
      setCurrentProject(null);
      return [];
    } finally {
      setLoading(false);
    }
  }, [routeWorkspaceId, routeProjectId, currentWorkspace?._id]);

  // ✅ depend on the memoized function
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        setProjects,
        currentProject,
        setCurrentProject,
        loading,
        refetchProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
