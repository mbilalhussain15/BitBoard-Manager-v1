import { boardService } from "../lib/api-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


export const UseCreateBoard = () => {
const qc = useQueryClient();
return useMutation({
mutationFn: async (payload: any) => {
const { projectId, ...body } = payload || {};
// keep body fields aligned with old Board modals: { boardName, columns, teamMemberIDs }
const res = await boardService.postData(`/boards/${projectId}/create-board`, body);
return res;
},
});
};


export const UseUpdateBoard = () => {
const qc = useQueryClient();
return useMutation({
mutationFn: async (payload: any) => {
const { boardId, ...body } = payload || {};
const res = await boardService.updateData(`/boards/${boardId}/update-board`, body);
qc.invalidateQueries({ queryKey: ["board", boardId] });
return res;
},
});
};


export const UseDeleteBoard = () => {
const qc = useQueryClient();
return useMutation({
mutationFn: async ({ boardId, projectId }: { boardId: string; projectId?: string }) => {
const res = await boardService.deleteData(`/boards/${boardId}/delete-board`);
if (projectId) qc.invalidateQueries({ queryKey: ["boards", projectId] });
qc.removeQueries({ queryKey: ["board", boardId] });
return res;
},
});
};

export async function fetchBoardById(boardId: string) {
  const res = await boardService.fetchData(`/boards/${boardId}`);

  return res;
}

export const UseUpdateBoardColumns = () => {
  const qc = useQueryClient();

  return useMutation({
    /** server call */
    mutationFn: async (payload: { boardId: string; columns: any[]; projectId?: string }) => {
      const { boardId, columns } = payload;
      return await boardService.updateData(`/boards/${boardId}/update-columns`, { columns });
    },

    /** optimistic UI: patch query cache immediately */
    onMutate: async (variables) => {
      const { projectId, boardId, columns } = variables || {};
      if (!projectId || !boardId) return;

      await qc.cancelQueries({ queryKey: ["boards", projectId] });
      const prev = qc.getQueryData<any[]>(["boards", projectId]);

      // optimistic replace
      if (Array.isArray(prev)) {
        const next = prev.map((b) =>
          String(b._id) === String(boardId) ? { ...b, columns } : b
        );
        qc.setQueryData(["boards", projectId], next);
      }

      return { prev, projectId };
    },

    
  });
};


export function UseBoardById(boardId?: string) {
  return useQuery({
    queryKey: ["board", boardId],
    enabled: !!boardId,
    queryFn: async () => boardService.fetchData(`/boards/${boardId}`), // boardsController.getBoardById
  });
}
