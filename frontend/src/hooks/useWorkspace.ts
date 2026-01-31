import { workspaceService } from "../lib/api-utils";
import { useMutation, useQuery } from "@tanstack/react-query";


// export const useCreateWorkspace = () => {
//   return useMutation({
//     mutationFn: async (data) => {
//       workspaceService.postData("/workspaces/createWorkspace", data)
//     }
//   });
// };
export const useCreateWorkspace = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await workspaceService.postData("/workspaces/createWorkspace", payload);
      return res; 
    },
  });
};

export const useGetWorkspacesQuery = () => {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => workspaceService.fetchData("/workspaces"),
  });
};

export const useGetWorkspaceQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => workspaceService.fetchData(`/workspaces/${workspaceId}/projects`),
  });
};

export const useGetWorkspaceStatsQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace", workspaceId, "stats"],
    queryFn: async () => workspaceService.fetchData(`/workspaces/${workspaceId}/stats`),
  });
};

export const useGetWorkspaceDetailsQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace", workspaceId, "details"],
    queryFn: async () => workspaceService.fetchData(`/workspaces/${workspaceId}`),
  });
};

export const useInviteMemberMutation = () => {
  return useMutation({
    mutationFn: (data: { email: string; role: string; workspaceId: string }) =>
      workspaceService.postData(`/workspaces/${data.workspaceId}/invite-member`, data),
  });
};

export const useAcceptInviteByTokenMutation = () => {
  return useMutation({
    mutationFn: (token: string) =>
      workspaceService.postData(`/workspaces/accept-invite-token`, {
        token,
      }),
  });
};

export const useAcceptGenerateInviteMutation = () => {
  return useMutation({
    mutationFn: (workspaceId: string) =>
      workspaceService.postData(`/workspaces/${workspaceId}/accept-generate-invite`, {}),
  });
};

