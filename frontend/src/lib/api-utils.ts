import { authApi, workspaceApi, projectApi, boardApi, taskApi, commentApi, aiPlannerApi } from "./fetch-util";

const createApiHelpers = (client: typeof authApi) => ({
  postData: async <T>(url: string, data: unknown): Promise<T> => {
    const response = await client.post(url, data);
    return response.data;
  },
  fetchData: async <T>(url: string): Promise<T> => {
    const response = await client.get(url);
    return response.data;
  },
  updateData: async <T>(url: string, data: unknown): Promise<T> => {
    const response = await client.put(url, data);
    return response.data;
  },
  deleteData: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await client.delete(url, { data });
    return response.data;
  },
});

// export helpers for each service
export const authService = createApiHelpers(authApi);
export const workspaceService = createApiHelpers(workspaceApi);
export const projectService = createApiHelpers(projectApi);
export const boardService = createApiHelpers(boardApi);
export const taskService = createApiHelpers(taskApi);
export const commentService = createApiHelpers(commentApi);
export const aiPlannerService = createApiHelpers(aiPlannerApi);
