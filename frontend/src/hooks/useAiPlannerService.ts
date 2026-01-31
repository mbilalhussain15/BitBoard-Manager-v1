// frontend/lib/useAiPlannerService.ts
import { aiPlannerService } from "../lib/api-utils";
import { useMutation } from "@tanstack/react-query";

export const usePlanGenerate = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await aiPlannerService.postData("/plan/generate", payload);
      return res;
    },
  });
};

export const UseAutoDescribeTask = () => {
  return useMutation({
    mutationFn: async (payload: { title: string; boardSnapshot?: any }) => {
      // adjust the path if your server routes differ, e.g. "/task/autoDescribe"
      return await aiPlannerService.postData("/task-agent/auto-describe", payload);
    },
  });
};

// NEW: improve title + description
export const UseImproveTask = () => {
  return useMutation({
    mutationFn: async (payload: { title: string; description: string; boardSnapshot?: any }) => {
      // adjust the path if your server routes differ, e.g. "/task/improve"
      return await aiPlannerService.postData("/task-agent/improve", payload);
    },
  });
};

export const UseBulkGenerateTasks = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      // backend controller: bulkGenerate -> runBulkGenerate(...)
      // route name assumed consistent with the others
      const res = await aiPlannerService.postData("/task-agent/bulk-generate", payload);
      return res;
    },
  });
};