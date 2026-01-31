import React, { useEffect, useMemo, useState } from "react";
import {
  useListReplies,
  useEditComment,
  useDeleteComment,
  useCreateReply,
} from "../../hooks/useCommentService";
import Initials from "./Initials";
import MentionInput from "./MentionInput";
import Thumb from "./Thumb";
import ConfirmModal from "./ConfirmModal";
import useMe from "./useMe";
import { getInitials } from "../../utils/index";
import ReplyItem from "./ReplyItem";
import { Avatar, AvatarFallback, AvatarImage } from "../form/avatar";

// util: highlight @mentions in blue
function highlightMentions(text, users, mentions = []) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  for (const m of mentions) {
    const user = users.find(u => String(u.id) === String(m.user));
    if (user) {
      const name = user.name || "User";
      const re = new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\b)`, "g");
      html = html.replace(re, `<span class="bg-blue-500/20 text-blue-200 px-1 rounded">@${name}</span>`);
    }
  }
  return html;
}


function broadcastEditorOpen(key, source) {
  window.dispatchEvent(new CustomEvent("comments:editor-open", { detail: { key, source } }));
}

export default function ParentComment({ comment, taskId, onAfterChange, users = [] }) {
  const me = useMe();
  // console.log("users main=", users);

  // Resolve author from comment.userId
  const author = useMemo(() => {
    const uid = String(comment?.userId ?? "");
    if (!uid) return { id: "", name: "User" };

    const fromUsers = Array.isArray(users) ? users.find(u => String(u.id) === uid) : null;
    if (fromUsers) return fromUsers;

    if (String(me.id) === uid) {
      return {
        id: me.id,
        name: me.name,
        email: me.user?.email,
        avatarUrl: me.user?.profilePicture || me.avatarUrl,
      };
    }
    return { id: uid, name: "User" };
  }, [comment?.userId, users, me]);

  // Mentionable members = all users except parent author
  const members = useMemo(
    () => (Array.isArray(users) ? users.filter(u => String(u.id) !== String(comment?.userId)) : []),
    [users, comment?.userId]
  );

  const isOwner = String(comment.userId) === String(me.id);

  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(comment.text);
  const [valMentions, setValMentions] = useState([]);
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [replyMentions, setReplyMentions] = useState([]);
  const [confirm, setConfirm] = useState(false);

  const {
    data: replies = [],
    isLoading: loadingReplies,
    refetch: refetchReplies,
  } = useListReplies(comment._id, 50);

  const { mutateAsync: saveEdit, isPending: saving } = useEditComment();
  const { mutateAsync: remove, isPending: deleting } = useDeleteComment();
  const { mutateAsync: doReply, isPending: addingReply } = useCreateReply();

  const token = useMemo(() => Math.random().toString(36).slice(2), []);

  useEffect(() => {
    function onOpen(e) {
      const { source } = e.detail || {};
      if (source === token) return;        // ignore self
      // close everything if someone else opened any editor
      setEditing(false);
      setReplyOpen(false);
    }
    window.addEventListener("comments:editor-open", onOpen);
    return () => window.removeEventListener("comments:editor-open", onOpen);
  }, [token]);


  async function handleSave() {
    const clean = val.trim();
    if (!clean) return;
    await saveEdit({ commentId: comment._id, text: clean, mentions: valMentions });
    setEditing(false);
    onAfterChange?.();
  }

  async function handleDelete() {
    await remove({ commentId: comment._id });
    setConfirm(false);
    onAfterChange?.();
  }

  async function submitReply() {
    const clean = reply.trim();
    if (!clean || !me.id) return;
    await doReply({
      commentId: comment._id,
      text: clean,
      userId: me.id,
      task: taskId,
      mentions: replyMentions,
    });
    setReply("");
    setReplyMentions([]);
    setReplyOpen(false);
    refetchReplies();
    onAfterChange?.();
  }

  const authorName = author?.name || "User";
  const authorInitials = getInitials(authorName) || "US";
  const createdAt = comment?.createdAt ? new Date(comment.createdAt).toLocaleString() : "";


  return (
    <div className="rounded-md border bg-[#f5f5f5]  border-[#e5e5e5] dark:bg-[#242424] dark:border-[#282828] p-3 text-black dark:text-white">
      <div className="flex items-start gap-3">
        {/* <Initials text={authorInitials} src={author.avatarUrl} alt={authorName} /> */}
        <Avatar className="w-8 h-8">
          <AvatarImage src={author.avatarUrl} alt={author.name} />
          <AvatarFallback>
            {authorInitials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{authorName}</span>
            <span className="text-xs text-gray-400">{createdAt}</span>
          </div>

          {!editing ? (
            <p
              className="mt-1 text-sm whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: highlightMentions(comment.text, users, comment.mentions) }}

            />
          ) : (
            <>
              <MentionInput
                value={val}
                onChange={setVal}
                onMentionsChange={setValMentions}
                placeholder="Edit comment"
                rows={4}
                users={members}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm text-center text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 
                        focus:ring-4 focus:ring-indigo-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800  
                        flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 rounded-md bg-[#e5e5e5] dark:bg-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {!editing && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              {/* <button onClick={() => setReplyOpen(v => !v)} className="text-indigo-400 hover:underline">
                Reply
              </button> */}
              <button
                onClick={() => {
                  const next = !replyOpen;
                  if (next) broadcastEditorOpen(`parent-reply-composer:${comment._id}`, token);
                  setReplyOpen(next);
                  if (next) setEditing(false);
                }}
                className="text-indigo-400 hover:underline"
              >
                Reply
              </button>
              {isOwner && (
                <>
                  {/* <button onClick={() => setEditing(true)} className="text-green-400 hover:underline" >
                    Edit
                  </button> */}
                <button
                  onClick={() => {
                    broadcastEditorOpen(`parent-edit:${comment._id}`, token);
                    setEditing(true);
                    setReplyOpen(false);
                  }}
                  className="text-green-400 hover:underline"
                >
                  Edit
                </button>
                  <button onClick={() => setConfirm(true)} className="text-red-400 hover:underline">
                    Delete
                  </button>
                </>
              )}
              <Thumb comment={comment} myUserId={me.id} showCount onChanged={onAfterChange} users={users} />
            </div>
          )}

          {replyOpen && (
            <div className="mt-3 pl-4 border-l-4 border-gray-700">
              <div className="flex items-start gap-3">
                <Initials text={me.initials} size={28} />
                <div className="flex-1">
                  <MentionInput
                    value={reply}
                    onChange={setReply}
                    onMentionsChange={setReplyMentions}
                    placeholder="Write a reply…"
                    rows={3}
                    users={members}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={submitReply}
                      disabled={!reply.trim() || addingReply}
                      className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => setReplyOpen(false)}
                      className="px-3 py-1.5 rounded-md bg-[#e5e5e5] dark:bg-gray-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loadingReplies ? (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Loading replies…</p>
          ) : replies.length > 0 ? (
            <ul className="mt-3 space-y-3 pl-4 border-l-4 border-[#e5e5e5] dark:border-gray-700">
              {replies.map((r) => (
                <li key={r._id}>
                  <ReplyItem
                    reply={r}
                    parentId={comment._id}
                    taskId={taskId}
                    users={users}            // pass users for author + mentions
                    onChange={() => {
                      refetchReplies();
                      onAfterChange?.();
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          onCancel={() => setConfirm(false)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
}

























// import React, { useState } from "react";
// import { useListReplies, useEditComment, useDeleteComment, useCreateReply } from "../../hooks/useCommentService";
// import Initials from "./Initials";
// import MentionInput from "./MentionInput";
// import Thumb from "./Thumb";
// import ReplyItem from "./ReplyItem";
// import ConfirmModal from "./ConfirmModal";
// import useMe from "./useMe";
// import { getInitials } from "../../utils/index"; 

// export default function ParentComment({ comment, taskId, onAfterChange, users }) {
//   const me = useMe();

//   const parentAuthorId = String(comment.userId || "");

//   const members = Array.isArray(users)
//     ? users.filter(u => String(u.id) !== parentAuthorId)
//     : [];

//     const meWithMembers = { ...me, members };

//   const isOwner = String(comment.userId) === String(me.id);

// //   console.log("isOwner", isOwner);
//   console.log("me", me);
// //   console.log("taskId", taskId);
// //   console.log("me.id", me.id);
// //   console.log("comment.userId", comment.userId);

//   const [editing, setEditing] = useState(false);
//   const [val, setVal] = useState(comment.text);
//   const [valMentions, setValMentions] = useState([]);
//   const [replyOpen, setReplyOpen] = useState(false);
//   const [reply, setReply] = useState("");
//   const [replyMentions, setReplyMentions] = useState([]);
//   const [confirm, setConfirm] = useState(false);

//   const {
//     data: replies = [],
//     isLoading: loadingReplies,
//     refetch: refetchReplies,
//   } = useListReplies(comment._id, 50);

//   const { mutateAsync: saveEdit, isPending: saving } = useEditComment();
//   const { mutateAsync: remove, isPending: deleting } = useDeleteComment();
//   const { mutateAsync: doReply, isPending: addingReply } = useCreateReply();

//   async function handleSave() {
//     const clean = val.trim();
//     if (!clean) return;
//     await saveEdit({ commentId: comment._id, text: clean, mentions: valMentions });
//     setEditing(false);
//     onAfterChange?.();
//   }

//   async function handleDelete() {
//     await remove({ commentId: comment._id });
//     setConfirm(false);
//     onAfterChange?.();
//   }

//   async function submitReply() {
//     const clean = reply.trim();
//     if (!clean || !me.id) return;
//     await doReply({
//       commentId: comment._id,
//       text: clean,
//       userId: me.id,
//       task: taskId,
//       mentions: replyMentions,
//     });
//     setReply("");
//     setReplyMentions([]);
//     setReplyOpen(false);
//     refetchReplies();
//     onAfterChange?.();
//   }

//   return (
//     <div className="rounded-md bg-[#1a1a1a] border border-gray-800 p-3 text-gray-100">
//       <div className="flex items-start gap-3">
//         <Initials
//           text={
//             comment.author?.name
//               ? comment.author.name
//                   .split(" ")
//                   .slice(0, 2)
//                   .map((s) => s[0]?.toUpperCase())
//                   .join("")
//               : "US"
//           }
//         />
//         <div className="flex-1 min-w-0">
//           <div className="flex flex-wrap items-center gap-2">
//             <span className="text-sm font-semibold">
//               {comment.author?.name || "User"}
//             </span>
//             <span className="text-xs text-gray-400">
//               {new Date(comment.createdAt).toLocaleString()}
//             </span>
//           </div>

//           {!editing ? (
//             <p className="mt-1 text-sm whitespace-pre-wrap">{comment.text}</p>
//           ) : (
//             <>
//               <MentionInput
//                 value={val}
//                 onChange={setVal}
//                 onMentionsChange={setValMentions}
//                 placeholder="Edit comment"
//                 rows={4}
//                 users={members}
//               />
//               <div className="mt-2 flex gap-2">
//                 <button
//                   onClick={handleSave}
//                   disabled={saving}
//                   className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm"
//                 >
//                   Save
//                 </button>
//                 <button
//                   onClick={() => setEditing(false)}
//                   className="px-3 py-1.5 rounded-md bg-gray-700 text-sm"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </>
//           )}

//           {!editing && (
//             <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
//               <button
//                 onClick={() => setReplyOpen((v) => !v)}
//                 className="text-indigo-400 hover:underline"
//               >
//                 Reply
//               </button>
//               {isOwner && (
//                 <>
//                   <button
//                     onClick={() => setEditing(true)}
//                     className="text-green-400 hover:underline"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => setConfirm(true)}
//                     className="text-red-400 hover:underline"
//                   >
//                     Delete
//                   </button>
//                 </>
//               )}
//               <Thumb
//                 comment={comment}
//                 myUserId={me.id}
//                 showCount
//                 onChanged={onAfterChange}
//               />
//             </div>
//           )}

//           {replyOpen && (
//             <div className="mt-3 pl-4 border-l-4 border-gray-700">
//               <div className="flex items-start gap-3">
//                 <Initials text={me.initials} size={28} />
//                 <div className="flex-1">
//                   <MentionInput
//                     value={reply}
//                     onChange={setReply}
//                     onMentionsChange={setReplyMentions}
//                     placeholder="Write a reply…"
//                     rows={3}
//                   />
//                   <div className="mt-2 flex gap-2">
//                     <button
//                       onClick={submitReply}
//                       disabled={!reply.trim() || addingReply}
//                       className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm"
//                     >
//                       Reply
//                     </button>
//                     <button
//                       onClick={() => setReplyOpen(false)}
//                       className="px-3 py-1.5 rounded-md bg-gray-700 text-sm"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {loadingReplies ? (
//             <p className="text-[11px] text-gray-400 mt-2">Loading replies…</p>
//           ) : replies.length > 0 ? (
//             <ul className="mt-3 space-y-3 pl-4 border-l-4 border-gray-700">
//               {replies.map((r) => (
//                 <li key={r._id}>
//                   <ReplyItem
//                     reply={r}
//                     parentId={comment._id}
//                     taskId={taskId}
//                     onChange={() => {
//                       refetchReplies();
//                       onAfterChange?.();
//                     }}
//                   />
//                 </li>
//               ))}
//             </ul>
//           ) : null}
//         </div>
//       </div>

//       {confirm && (
//         <ConfirmModal
//           onCancel={() => setConfirm(false)}
//           onConfirm={handleDelete}
//           loading={deleting}
//         />
//       )}
//     </div>
//   );
// }
