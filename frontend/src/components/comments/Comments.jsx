import React, { useMemo, useState } from "react";
import { useListTaskComments, useCreateComment } from "../../hooks/useCommentService";
import Initials from "./Initials";
import MentionInput from "./MentionInput";
import ParentComment from "./ParentComment";
import useMe from "./useMe";
import { Avatar, AvatarFallback, AvatarImage } from "../form/avatar";

export default function Comments({ taskId, currentBoard }) {
  const me = useMe();
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState([]);

  const { data: comments = [], isLoading, refetch } = useListTaskComments(taskId, 50);
  const { mutateAsync: createComment, isPending } = useCreateComment();


  // Board members → users list for mentions and author resolve
  const users = useMemo(() => {
    return (currentBoard?.members ?? [])
      .map((m) => ({
        id: m.user?._id || m._id,
        userId: m.user?.userId || m.userId,
        name: m.user?.name || m.name,
        email: m.user?.email,
        avatarUrl: m.user?.profilePicture,
      }))
      .filter((u) => u.id && u.name);
  }, [currentBoard]);


  async function post() {
    const clean = text.trim();
    if (!clean || !me.id) return;
    await createComment({ taskId, userId: me.id, text: clean, mentions });
    setText("");
    setMentions([]);
    refetch();
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Comments</h3>

      <div className="rounded-md bg-[#f5f5f5] dark:bg-[#242424] p-3 border border-[#e5e5e5] dark:border-[#282828] mb-5">
        <div className="flex items-start gap-3">
          {/* <Initials text={me.initials} /> */}
           <Avatar className="w-8 h-8">
              <AvatarImage src={me.user?.profilePicture} alt={me.name} />
              <AvatarFallback>{me.initials}</AvatarFallback>
            </Avatar>
          <div className="flex-1">
            <MentionInput
              value={text}
              onChange={setText}
              onMentionsChange={setMentions}
              placeholder="Add a comment…  Type @ to mention someone"
              users={users}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={post}
                disabled={!text.trim() || isPending}
                className="px-4 py-1.5 text-sm disabled:opacity-50
                font-medium text-center text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 
                focus:ring-4 focus:ring-indigo-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800  
                flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-black dark:text-white">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-black dark:text-white"></p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c._id}>
              <ParentComment
                comment={c}
                taskId={taskId}
                onAfterChange={refetch}
                users={users}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}































// import React, { useMemo, useState } from "react";
// import { useListTaskComments, useCreateComment } from "../../hooks/useCommentService";
// import Initials from "./Initials";
// import MentionInput from "./MentionInput";
// import ParentComment from "./ParentComment";
// import useMe from "./useMe";

// export default function Comments({ taskId, currentBoard }) {
//   const me = useMe();
//   const [text, setText] = useState("");
//   const [mentions, setMentions] = useState([]);


//   const { data: comments = [], isLoading, refetch } = useListTaskComments(taskId, 50);
//   const { mutateAsync: createComment, isPending } = useCreateComment();

//   console.log("main me=", me);

//   async function post() {
//     const clean = text.trim();
//     if (!clean || !me.id) return;
//     await createComment({ taskId, userId: me.id, text: clean, mentions });
//     setText("");
//     setMentions([]);
//     refetch();
//   }

//    const mentionableUsers = useMemo(() => {
//     const members = currentBoard?.members ?? [];
//     return members
//       // optionally limit by role
//       // .filter(m => ["admin","contributor","member"].includes(m.role))
//       .map(m => ({
//         id: m.user?._id,
//         name: m.user?.name,
//         email: m.user?.email,
//         avatar: m.user?.profilePicture,
//         role: m.role,
//         addedAt: m.addedAt,
//       }))
//       .filter(u => !!u.id); // keep only valid users
//   }, [currentBoard]);

//   const users =
//     (currentBoard?.members ?? [])
//       .map(m => ({
//         id: m.user?._id || m._id,
//         name: m.user?.name || m.name,
//         email: m.user?.email,
//         avatarUrl: m.user?.profilePicture,
//       }))
//       .filter(u => u.id && u.name);

//   return (
//     <div className="w-full">
//       <h3 className="text-lg font-semibold text-gray-100 mb-3">Comments</h3>

//       <div className="rounded-md bg-[#1d1d1d] p-3 border border-gray-800 mb-5">
//         <div className="flex items-start gap-3">
//           <Initials text={me.initials} />
//           <div className="flex-1">
//             <MentionInput
//               value={text}
//               onChange={setText}
//               onMentionsChange={setMentions}
//               placeholder="Add a comment…  Type @ to mention someone"
//             />
//             <div className="mt-2 flex justify-end">
//               <button
//                 onClick={post}
//                 disabled={!text.trim() || isPending}
//                 className="px-4 py-1.5 rounded-md bg-indigo-600 text-white text-sm disabled:opacity-50"
//               >
//                 Post
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {isLoading ? (
//         <p className="text-sm text-gray-400">Loading comments…</p>
//       ) : comments.length === 0 ? (
//         <p className="text-sm text-gray-400">No comments yet</p>
//       ) : (
//         <ul className="space-y-4">
//           {comments.map((c) => (
//             <li key={c._id}>
//               <ParentComment 
//               comment={c} 
//               taskId={taskId} 
//               onAfterChange={refetch}
//               users={users}     
//               />
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }
