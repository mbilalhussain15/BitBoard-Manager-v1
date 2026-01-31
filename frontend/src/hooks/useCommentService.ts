// src/hooks/useCommentService.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentService } from "../lib/api-utils";

type CommentDoc = {
  _id: string;
  text: string;
  userId: string;
  taskId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  reactions?: { emoji: string; userId: string }[];
};

type CreateInput = {
  taskId: string;
  userId: string;
  text: string;
  mentions?: any[];
  attachments?: any[];
};
type ReplyInput = {
  commentId: string;
  text: string;
  userId: string;
  task: string;
  mentions?: any[];
  attachments?: any[];
};

const listTaskCommentsKey = (taskId: string) => ["comments", "task", taskId];
const listRepliesKey = (commentId: string) => ["comments", "replies", commentId];

export function useListTaskComments(taskId: string, limit = 20) {
  return useQuery({
    queryKey: listTaskCommentsKey(taskId),
    queryFn: async (): Promise<CommentDoc[]> => {
      const url = `/comments/tasks/${taskId}/comments?limit=${limit}`;
      return commentService.fetchData<CommentDoc[]>(url);
    },
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput): Promise<CommentDoc> => {
      const url = `/comments/tasks/${input.taskId}/comments`;
      return commentService.postData<CommentDoc>(url, {
        text: input.text,
        userId: input.userId,
        mentions: input.mentions ?? [],
        attachments: input.attachments ?? [],
      }); // backend createComment expects text and userId, taskId in URL. :contentReference[oaicite:3]{index=3}
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: listTaskCommentsKey(doc.taskId) });
    },
  });
}

export function useListReplies(commentId: string, limit = 20) {
  return useQuery({
    queryKey: listRepliesKey(commentId),
    queryFn: async (): Promise<CommentDoc[]> => {
      const url = `/comments/${commentId}/replies?limit=${limit}`;
      return commentService.fetchData<CommentDoc[]>(url);
    },
    enabled: !!commentId,
  });
}

export function useCreateReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReplyInput): Promise<CommentDoc> => {
      const url = `/comments/${input.commentId}/replies`;
      return commentService.postData<CommentDoc>(url, {
        text: input.text,
        task: input.task,
        userId: input.userId,
        mentions: input.mentions ?? [],
        attachments: input.attachments ?? [],
      }); // backend reply expects text task userId. :contentReference[oaicite:4]{index=4}
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: listRepliesKey(vars.commentId) });
      qc.invalidateQueries({ queryKey: listTaskCommentsKey(vars.task) as any });
    },
  });
}

export function useEditComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, text,mentions = [], }: { commentId: string; text: string; mentions?: any[] }) => {
      const url = `/comments/${commentId}`; 
      return commentService.updateData<CommentDoc>(url, { text, mentions  });
    }, // PUT /comments/:commentId updates text. :contentReference[oaicite:5]{index=5}
    onSuccess: () => {
      qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "comments" });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      const url = `/comments/${commentId}`;
      return commentService.deleteData(url);
    }, // DELETE /comments/:commentId. :contentReference[oaicite:6]{index=6}
    onSuccess: () => {
      qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "comments" });
    },
  });
}




export function useReactComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, emoji, userId }: { commentId: string; emoji: string; userId: string }) => {
      const url = `/comments/${commentId}/reactions`;
      return commentService.postData(url, { emoji, userId }); // ✅ fix: send userId
    },
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "comments",
      });
    },
  });
}

export function useUnreactComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, userId }: { commentId: string; userId: string }) => {
      const url = `/comments/${commentId}/reactions`;
      return commentService.deleteData(url, { userId }); // ✅ fix: send userId only
    },
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "comments",
      });
    },
  });
}














// export function useReactComment() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async ({ commentId, emoji, user }: { commentId: string; emoji: string; user: string }) => {
//       const url = `/comments/${commentId}/reactions`;
//       return commentService.postData<CommentDoc>(url, { emoji, user });
//     }, // POST reactions. :contentReference[oaicite:7]{index=7} :contentReference[oaicite:8]{index=8}
//     onSuccess: () => {
//       qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "comments" });
//     },
//   });
// }

// export function useUnreactComment() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async ({ commentId, emoji, user }: { commentId: string; emoji: string; user: string }) => {
//       const url = `/comments/${commentId}/reactions`;
//       return commentService.deleteData(url, { emoji, user });
//     }, // DELETE reactions. :contentReference[oaicite:9]{index=9} :contentReference[oaicite:10]{index=10}
//     onSuccess: () => {
//       qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "comments" });
//     },
//   });
// }
