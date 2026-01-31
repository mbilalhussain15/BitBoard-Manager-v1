
import { projectService } from "../lib/api-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const UseCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { workspaceId, ...projectBody } = payload || {};
      const res = await projectService.postData(
        `/projects/${workspaceId}/create-project`,
        projectBody
      );
      return res; 
    },
  });
};


export const UseUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { projectId, ...body } = payload || {};
      const res = await projectService.updateData(`/projects/updateProject/${projectId}`, body);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      // workspace list refresh — optional if you track it like ["projects", workspaceId]
      return res;
    },
  });
};

export const UseDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, workspaceId }: { projectId: string; workspaceId?: string }) => {
      const res = await projectService.deleteData(`/projects/deleteProject/${projectId}`);
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      }
      queryClient.removeQueries({ queryKey: ["project", projectId] });
      return res;
    },
  });
};

export const useGetProjectQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => projectService.fetchData(`/projects/${projectId}/boards`),
  });
};

// export const UseProjectQuery = (projectId: string) => {
//   return useQuery({
//     queryKey: ["project", projectId],
//     queryFn: () => projectService.fetchData(`/projects/${projectId}/tasks`),
//   });
// };
