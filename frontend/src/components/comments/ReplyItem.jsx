import React, { useEffect, useMemo, useState } from "react";
import { useEditComment, useDeleteComment, useCreateReply } from "../../hooks/useCommentService";
import Initials from "./Initials";
import MentionInput from "./MentionInput";
import Thumb from "./Thumb";
import ConfirmModal from "./ConfirmModal";
import useMe from "./useMe";
import { getInitials } from "../../utils/index";
import { Avatar, AvatarFallback, AvatarImage } from "../form/avatar";

// same highlighter as parent
function highlightMentions(text, users) {
  if (!text) return "";
  const names = (users || []).map(u => u.name).filter(Boolean).sort((a,b)=>b.length-a.length);
  let html = text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  for (const n of names) {
    const re = new RegExp(`@${n.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(?=\\b)`, "g");
    html = html.replace(
      re,
      `<span class="bg-blue-500/20 text-blue-200 px-1 rounded">@${n}</span>`
    );
  }
  return html;
}

function broadcastEditorOpen(key, source) {
  window.dispatchEvent(new CustomEvent("comments:editor-open", { detail: { key, source } }));
}


export default function ReplyItem({ reply, parentId, taskId, onChange, users = [] }) {
  const me = useMe();
  const isOwner = String(reply.userId) === String(me.id);

  const author = useMemo(() => {
    const uid = String(reply?.userId ?? "");
    if (!uid) return { id: "", name: "User" };
    const fromUsers = Array.isArray(users) ? users.find(u => String(u.id) === uid) : null;
    if (fromUsers) return fromUsers;
    if (String(me.id) === uid) return { id: me.id, name: me.name, avatarUrl: me.user?.profilePicture };
    return { id: uid, name: "User" };
  }, [reply?.userId, users, me]);

  // mention list for reply editor (exclude self if you want)
  const members = Array.isArray(users) ? users.filter(u => String(u.id) !== String(reply?.userId)) : [];

  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(reply.text);
  const [valMentions, setValMentions] = useState([]);
  const [replyOpen, setReplyOpen] = useState(false);
  const [text, setText] = useState("");
  const [textMentions, setTextMentions] = useState([]);
  const [confirm, setConfirm] = useState(false);

  const { mutateAsync: saveEdit, isPending: saving } = useEditComment();
  const { mutateAsync: remove, isPending: deleting } = useDeleteComment();
  const { mutateAsync: doReply, isPending: addingReply } = useCreateReply();

  const token = useMemo(() => Math.random().toString(36).slice(2), []);

  useEffect(() => {
    function onOpen(e) {
      const { source } = e.detail || {};
      if (source === token) return;     // ignore self
      setEditing(false);
      setReplyOpen(false);
    }
    window.addEventListener("comments:editor-open", onOpen);
    return () => window.removeEventListener("comments:editor-open", onOpen);
  }, [token]);

  async function handleSave() {
    const clean = val.trim();
    if (!clean) return;
    await saveEdit({ commentId: reply._id, text: clean, mentions: valMentions });
    setEditing(false);
    onChange?.();
  }

  async function handleDelete() {
    await remove({ commentId: reply._id });
    setConfirm(false);
    onChange?.();
  }

  async function submitReply() {
    const clean = text.trim();
    if (!clean || !me.id) return;
    await doReply({
      commentId: parentId,
      text: clean,
      userId: me.id,
      task: taskId,
      mentions: textMentions,
    });
    setText("");
    setTextMentions([]);
    setReplyOpen(false);
    onChange?.();
  }

  const authorName = author?.name || "User";

  return (
    <div className="rounded-md bg-transparent p-2">
      <div className="flex items-start gap-3">
        {/* <Initials text={getInitials(authorName) || "US"} size={28} /> */}
         <Avatar className="w-7 h-7">
            <AvatarImage src={author.avatarUrl} alt={authorName} />
            <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
          </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium">{authorName}</span>
            <span className="text-[11px] text-gray-400">
              {new Date(reply.createdAt).toLocaleString()}
            </span>
          </div>

          {!editing ? (
            <p
              className="mt-1 text-sm"
              dangerouslySetInnerHTML={{ __html: highlightMentions(reply.text, users) }}
            />
          ) : (
            <>
              <MentionInput
                value={val}
                onChange={setVal}
                onMentionsChange={setValMentions}
                placeholder="Edit reply"
                rows={3}
                users={members}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm font-medium text-center text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 
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
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
              {/* <button onClick={() => setReplyOpen(v => !v)} className="text-indigo-400 hover:underline">
                Reply
              </button> */}
               <button
                  onClick={() => {
                    const next = !replyOpen;
                    if (next) broadcastEditorOpen(`parent-reply-composer:${parentId}`, token);
                    setReplyOpen(next);
                    if (next) setEditing(false);
                  }}
                  className="text-indigo-400 hover:underline"
                >
                  Reply
                </button>
              {isOwner && (
                <>
                  {/* <button onClick={() => setEditing(true)} className="text-green-400 hover:underline">
                    Edit
                  </button> */}
                   <button
                      onClick={() => {
                        broadcastEditorOpen(`reply-edit:${reply._id}`, token);
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
              <Thumb comment={reply} myUserId={me.id} onChanged={onChange} showCount users={users}  />
            </div>
          )}

          {replyOpen && (
            <div className="mt-2">
              <div className="flex items-start gap-3">
                <Initials text={me.initials} size={24} />
                <div className="flex-1">
                  <MentionInput
                    value={text}
                    onChange={setText}
                    onMentionsChange={setTextMentions}
                    placeholder="Write a reply…"
                    rows={3}
                    users={members}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={submitReply}
                      disabled={!text.trim() || addingReply}
                      className="px-3 py-1.5 text-sm text-center text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 
                        focus:ring-4 focus:ring-indigo-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800  
                        flex items-center justify-center gap-2 disabled:cursor-not-allowed"
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
// import { useEditComment, useDeleteComment, useCreateReply } from "../../hooks/useCommentService";
// import Initials from "./Initials";
// import MentionInput from "./MentionInput";
// import Thumb from "./Thumb";
// import ConfirmModal from "./ConfirmModal";
// import useMe from "./useMe";

// export default function ReplyItem({ reply, parentId, taskId, onChange }) {
//   const me = useMe();
//   const isOwner = String(reply.userId) === String(me.id);

//   const [editing, setEditing] = useState(false);
//   const [val, setVal] = useState(reply.text);
//   const [valMentions, setValMentions] = useState([]);
//   const [replyOpen, setReplyOpen] = useState(false);
//   const [text, setText] = useState("");
//   const [textMentions, setTextMentions] = useState([]);
//   const [confirm, setConfirm] = useState(false);

//   const { mutateAsync: saveEdit, isPending: saving } = useEditComment();
//   const { mutateAsync: remove, isPending: deleting } = useDeleteComment();
//   const { mutateAsync: doReply, isPending: addingReply } = useCreateReply();

//   async function handleSave() {
//     const clean = val.trim();
//     if (!clean) return;
//     await saveEdit({ commentId: reply._id, text: clean, mentions: valMentions });
//     setEditing(false);
//     onChange?.();
//   }

//   async function handleDelete() {
//     await remove({ commentId: reply._id });
//     setConfirm(false);
//     onChange?.();
//   }

//   async function submitReply() {
//     const clean = text.trim();
//     if (!clean || !me.id) return;
//     await doReply({
//       commentId: parentId,
//       text: clean,
//       userId: me.id,
//       task: taskId,
//       mentions: textMentions,
//     });
//     setText("");
//     setTextMentions([]);
//     setReplyOpen(false);
//     onChange?.();
//   }

//   return (
//     <div className="rounded-md bg-transparent p-2">
//       <div className="flex items-start gap-3">
//         <Initials
//           text={
//             reply.author?.name
//               ? reply.author.name
//                   .split(" ")
//                   .slice(0, 2)
//                   .map((s) => s[0]?.toUpperCase())
//                   .join("")
//               : "US"
//           }
//           size={28}
//         />
//         <div className="flex-1">
//           <div className="flex flex-wrap items-center gap-2">
//             <span className="text-[13px] font-medium">
//               {reply.author?.name || "User"}
//             </span>
//             <span className="text-[11px] text-gray-400">
//               {new Date(reply.createdAt).toLocaleString()}
//             </span>
//           </div>

//           {!editing ? (
//             <p className="mt-1 text-sm">{reply.text}</p>
//           ) : (
//             <>
//               <MentionInput
//                 value={val}
//                 onChange={setVal}
//                 onMentionsChange={setValMentions}
//                 placeholder="Edit reply"
//                 rows={3}
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
//             <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
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
//                     <button
//                       onClick={() => setConfirm(true)}
//                       className="text-red-400 hover:underline"
//                     >
//                       Delete
//                     </button>
//                 </>
//               )}
//               <Thumb comment={reply} myUserId={me.id} onChanged={onChange} />
//             </div>
//           )}

//           {replyOpen && (
//             <div className="mt-2">
//               <div className="flex items-start gap-3">
//                 <Initials text={me.initials} size={24} />
//                 <div className="flex-1">
//                   <MentionInput
//                     value={text}
//                     onChange={setText}
//                     onMentionsChange={setTextMentions}
//                     placeholder="Write a reply…"
//                     rows={3}
//                   />
//                   <div className="mt-2 flex gap-2">
//                     <button
//                       onClick={submitReply}
//                       disabled={!text.trim() || addingReply}
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
