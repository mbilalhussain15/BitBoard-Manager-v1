// src/hooks/useTaskFileService.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function apiBase() {
  const env =
    (import.meta as any).env?.VITE_TASK_File_SERVICE_URL ||
    (window as any).__API_URL__ ||
    window.location.origin.replace(":5173", ":5002");
  return `${env.replace(/\/$/, "")}/taskFile`;
}

async function getJSON(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${url} failed ${res.status}`);
  return res.json();
}

async function postForm(url: string, fd: FormData) {
  const res = await fetch(url, { method: "POST", body: fd, credentials: "include" });
  if (!res.ok) throw new Error(`POST ${url} failed ${res.status}`);
  return res.json();
}

async function putJSON(url: string, body: any) {
  const res = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${url} failed ${res.status}`);
  return res.json();
}

async function del(url: string) {
  const res = await fetch(url, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(`DELETE ${url} failed ${res.status}`);
  return res.json().catch(() => ({}));
}

export function useGetTaskFiles(params: {
  workspaceId: string; projectId: string; boardId: string; taskId: string;
}) {
  const { workspaceId, projectId, boardId, taskId } = params;
  return useQuery({
    queryKey: ["taskFiles", taskId],
    enabled: !!taskId,
    queryFn: () =>
      getJSON(
        `${apiBase()}/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/files`
      ),
  });
}

export function useBulkUploadTaskFiles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      projectId,
      boardId,
      taskId,
      formData,
    }: {
      workspaceId: string;
      projectId: string;
      boardId: string;
      taskId: string;
      formData: FormData;
    }) =>
      postForm(
        `${apiBase()}/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/files/bulk`,
        formData
      ),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
    },
  });
}

export function useUpdateTaskFiles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      projectId,
      boardId,
      taskId,
      fileUrls,
    }: {
      workspaceId: string;
      projectId: string;
      boardId: string;
      taskId: string;
      fileUrls: any[];
    }) =>
      putJSON(
        `${apiBase()}/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/files`,
        { fileUrls }
      ),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
    },
  });
}

export function useDeleteTaskFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      projectId,
      boardId,
      taskId,
      fileName,
    }: {
      workspaceId: string;
      projectId: string;
      boardId: string;
      taskId: string;
      fileName: string;
    }) =>
      del(
        `${apiBase()}/files/workspace/${workspaceId}/project/${projectId}/board/${boardId}/task/${taskId}/${encodeURIComponent(
          fileName
        )}`
      ),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
    },
  });
}


































// import { useMutation, useQueryClient } from "@tanstack/react-query";

// function apiBase() {
//   const env =
//     (import.meta as any).env?.VITE_TASK_File_SERVICE_URL ||
//     (window as any).__API_URL__ ||
//     window.location.origin.replace(":5173", ":5002");
//   return `${env.replace(/\/$/, "")}/taskFile`;
// }

// async function postForm(url: string, fd: FormData) {
//   const res = await fetch(url, { method: "POST", body: fd, credentials: "include" });
//   if (!res.ok) throw new Error(`POST ${url} failed ${res.status}`);
//   return res.json();
// }
// async function putJSON(url: string, body: any) {
//   const res = await fetch(url, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     credentials: "include",
//     body: JSON.stringify(body),
//   });
//   if (!res.ok) throw new Error(`PUT ${url} failed ${res.status}`);
//   return res.json();
// }
// async function del(url: string) {
//   const res = await fetch(url, { method: "DELETE", credentials: "include" });
//   if (!res.ok) throw new Error(`DELETE ${url} failed ${res.status}`);
//   return res.json().catch(() => ({}));
// }

// export function useBulkUploadTaskFiles() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       workspaceId,
//       projectId,
//       boardId,
//       taskId,
//       formData,
//     }: {
//       workspaceId: string;
//       projectId: string;
//       boardId: string;
//       taskId: string;
//       formData: FormData;
//     }) =>
//       postForm(
//         `${apiBase()}/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/files/bulk`,
//         formData
//       ),
//     onSuccess: (_d, v) => {
//       qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
//     },
//   });
// }

// export function useUpdateTaskFiles() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       workspaceId,
//       projectId,
//       boardId,
//       taskId,
//       fileUrls,
//     }: {
//       workspaceId: string;
//       projectId: string;
//       boardId: string;
//       taskId: string;
//       fileUrls: any[];
//     }) =>
//       putJSON(
//         `${apiBase()}/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/files`,
//         { fileUrls }
//       ),
//     onSuccess: (_d, v) => {
//       qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
//     },
//   });
// }

// export function useDeleteTaskFile() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       workspaceId,
//       projectId,
//       boardId,
//       taskId,
//       fileName,
//     }: {
//       workspaceId: string;
//       projectId: string;
//       boardId: string;
//       taskId: string;
//       fileName: string;
//     }) =>
//       del(
//         `${apiBase()}/files/workspace/${workspaceId}/project/${projectId}/board/${boardId}/task/${taskId}/${encodeURIComponent(
//           fileName
//         )}`
//       ),
//     onSuccess: (_d, v) => {
//       qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
//     },
//   });
// }





















// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// function apiBase() {
//   const env =
//     (import.meta as any).env?.VITE_TASK_File_SERVICE_URL ||
//     (window as any).__API_URL__ ||
//     window.location.origin.replace(":5173", ":5002");
//   return `${env.replace(/\/$/, "")}/taskFile`;
// }

// async function postForm(url: string, fd: FormData) {
//   const res = await fetch(url, { method: "POST", body: fd, credentials: "include" });
//   if (!res.ok) throw new Error(`POST ${url} failed ${res.status}`);
//   return res.json();
// }
// async function putJSON(url: string, body: any) {
//   const res = await fetch(url, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     credentials: "include",
//     body: JSON.stringify(body),
//   });
//   if (!res.ok) throw new Error(`PUT ${url} failed ${res.status}`);
//   return res.json();
// }
// async function del(url: string) {
//   const res = await fetch(url, { method: "DELETE", credentials: "include" });
//   if (!res.ok) throw new Error(`DELETE ${url} failed ${res.status}`);
//   return res.json().catch(() => ({}));
// }

// export function useBulkUploadTaskFiles() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       workspaceId,
//       projectId,
//       boardId,
//       taskId,
//       formData,
//     }: {
//       workspaceId: string;
//       projectId: string;
//       boardId: string;
//       taskId: string;
//       formData: FormData;
//     }) =>
//       postForm(
//         `${apiBase()}/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/files/bulk`,
//         formData
//       ),
//     onSuccess: (_d, v) => {
//       qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
//     },
//   });
// }

// export function useUpdateTaskFiles() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       workspaceId,
//       projectId,
//       boardId,
//       taskId,
//       fileUrls,
//     }: {
//       workspaceId: string;
//       projectId: string;
//       boardId: string;
//       taskId: string;
//       fileUrls: any[];
//     }) =>
//       putJSON(
//         `${apiBase()}/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/files`,
//         { fileUrls }
//       ),
//     onSuccess: (_d, v) => {
//       qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
//     },
//   });
// }

// export function useDeleteTaskFile() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       workspaceId,
//       projectId,
//       boardId,
//       taskId,
//       fileName,
//     }: {
//       workspaceId: string;
//       projectId: string;
//       boardId: string;
//       taskId: string;
//       fileName: string;
//     }) =>
//       del(
//         `${apiBase()}/files/workspace/${workspaceId}/project/${projectId}/board/${boardId}/task/${taskId}/${encodeURIComponent(
//           fileName
//         )}`
//       ),
//     onSuccess: (_d, v) => {
//       qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
//     },
//   });
// }





















// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// function apiBase() {
//   const env =
//     (import.meta as any).env?.VITE_TASK_File_SERVICE_URL ||
//     (window as any).__API_URL__ ||
//     window.location.origin.replace(":5173", ":5002");
//   return `${env.replace(/\/$/, "")}/taskFile`;
// }

// async function getJSON(url: string) {
//   const res = await fetch(url, { credentials: "include" });
//   if (!res.ok) throw new Error(`GET ${url} failed ${res.status}`);
//   return res.json();
// }

// async function postForm(url: string, fd: FormData) {
//   const res = await fetch(url, { method: "POST", body: fd, credentials: "include" });
//   if (!res.ok) throw new Error(`POST ${url} failed ${res.status}`);
//   return res.json();
// }

// async function putJSON(url: string, body: any) {
//   const res = await fetch(url, {
//     method: "PUT",
//     credentials: "include",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(body),
//   });
//   if (!res.ok) throw new Error(`PUT ${url} failed ${res.status}`);
//   return res.json();
// }

// async function del(url: string) {
//   const res = await fetch(url, { method: "DELETE", credentials: "include" });
//   if (!res.ok) throw new Error(`DELETE ${url} failed ${res.status}`);
//   return res.json().catch(() => ({}));
// }

// export function useGetTaskFiles(taskId: string) {
//   return useQuery({
//     queryKey: ["taskFiles", taskId],
//     enabled: !!taskId,
//     queryFn: () => getJSON(`${apiBase()}/tasks/${taskId}/files`),
//   });
// }

// // single upload (still available)
// export function useUploadTaskFile() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ taskId, fileFormData }: { taskId: string; fileFormData: FormData }) =>
//       postForm(`${apiBase()}/tasks/${taskId}/files/upload`, fileFormData),
//     onSuccess: (_d, v) => {
//       qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
//     },
//   });
// }

// // bulk upload — new
// export function useBulkUploadTaskFiles() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ taskId, formData }: { taskId: string; formData: FormData }) =>
//       postForm(`${apiBase()}/tasks/${taskId}/files/bulk`, formData),
//     onSuccess: (_d, v) => {
//       qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
//     },
//   });
// }

// export function useUpdateTaskFiles() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ taskId, fileUrls }: { taskId: string; fileUrls: any[] }) =>
//       putJSON(`${apiBase()}/tasks/${taskId}/files`, { fileUrls }),
//     onSuccess: (_d, v) => {
//       qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
//     },
//   });
// }

// export function useDeleteTaskFile() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ taskId, fileName }: { taskId: string; fileName: string }) =>
//       del(`${apiBase()}/tasks/files/${taskId}/${encodeURIComponent(fileName)}`),
//     onSuccess: (_d, v) => {
//       qc.invalidateQueries({ queryKey: ["taskFiles", v.taskId] });
//     },
//   });
// }
