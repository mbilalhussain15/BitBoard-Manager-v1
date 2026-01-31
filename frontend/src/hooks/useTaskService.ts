import { taskService } from "../lib/api-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


export const UseCreateTask = () => {
const qc = useQueryClient();
return useMutation({
mutationFn: async (payload: any) => {
const { boardId, ...body } = payload || {};
const res = await taskService.postData(`/tasks/${boardId}/add-task`, body);
return res;
},
});
};

export async function fetchBoardById(taskId: string) {
  const res = await taskService.fetchData(`/tasks/${taskId}`);
  return res;
}


export const UseUpdateTask = () => {
const qc = useQueryClient();
return useMutation({
mutationFn: async (payload: any) => {
const { taskId, ...body } = payload || {};
const res = await taskService.updateData(`/tasks/${taskId}/update-task`, body);
qc.invalidateQueries({ queryKey: ["task", taskId] });
return res;
},
});
};


export function UseGetTaskById({ taskId, projectId }: { taskId?: string; projectId?: string }) {
  return useQuery({
    queryKey: ["task", taskId, projectId],
    enabled: !!taskId && !!projectId,
    queryFn: async () => taskService.fetchData(`/tasks/${taskId}?projectId=${projectId}`), 
  });
}

export const UseDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      taskId: string;
      boardId?: string;
      workspaceId?: string;
      projectId?: string;
    }) => {
      const { taskId, ...body } = vars;
      const res = await taskService.deleteData(`/tasks/${taskId}/delete-task`, body);
      return { res, ...vars };
    },
    onSuccess: (_d, v) => {
      if (v?.boardId) {
        qc.invalidateQueries({ queryKey: ["board", v.boardId] });
        qc.invalidateQueries({ queryKey: ["tasks", v.boardId] });
      }
      if (v?.taskId) qc.removeQueries({ queryKey: ["task", v.taskId] });
      qc.invalidateQueries({ queryKey: ["boards"] });
    },
  });
};

export const UseMoveTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      taskId: string;
      status: string;
      boardId?: string;
      projectId?: string;
      workspaceId?: string;
    }) => {
      const { taskId, ...body } = payload;
      // only status is sent
      const res = await taskService.updateData(`/tasks/${taskId}/move-status`, body);
      return res; // expect { ok, task, boardId, fromColumn, toColumn }
    },
    onSuccess: (data, vars) => {
      // light invalidations; no full refetch required if aap optimistic kar rahe ho
      if (vars?.boardId) {
        qc.invalidateQueries({ queryKey: ["board", vars.boardId] });
      }
      if (vars?.taskId) {
        qc.invalidateQueries({ queryKey: ["task", vars.taskId] });
      }
    },
  });
};