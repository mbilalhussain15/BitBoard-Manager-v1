// Thumb.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReactComment, useUnreactComment } from "../../hooks/useCommentService";
import { Avatar, AvatarImage, AvatarFallback } from "../form/avatar";   // path adjust if needed
import { getInitials } from "../../utils/index";                         // path adjust if needed

export default function Thumb({ comment, myUserId, onChanged, showCount = false, users = [] }) {
  const { mutateAsync: react } = useReactComment();
  const { mutateAsync: unreact } = useUnreactComment();
  const lockRef = useRef(false);

  // build a map that can resolve both users._id and userviews.userId
  const userMap = useMemo(() => {
    const m = new Map();
    (users || []).forEach(u => {
      const keys = [
        u?.id,
        u?._id,
        u?.userId,
        u?.user?._id
      ].filter(Boolean).map(String);
      keys.forEach(k => m.set(k, u));
    });
    return m;
  }, [users]);

  // normalize any reaction user shape into a single id string
  function getReactorId(r) {
    return String(
      r?.user?._id ??
      r?.userId?._id ??
      r?.user?.id ??
      r?.userId?.id ??
      r?.user ??
      r?.userId ??
      ""
    );
  }

  const reactions = Array.isArray(comment.reactions) ? comment.reactions : [];
  const mine = reactions.find(r => getReactorId(r) === String(myUserId))?.emoji || null;
  const likers = reactions.filter(r => r.emoji === "👍");
  const count = likers.length;

  const [localMine, setLocalMine] = useState(null);
  const [localCount, setLocalCount] = useState(null);
  const [open, setOpen] = useState(false);

  const active = (localMine ?? mine) === "👍";
  const displayCount = showCount ? (localCount ?? count) : null;

  async function toggle() {
    if (lockRef.current || !myUserId) return;
    lockRef.current = true;
    try {
      if (active) {
        setLocalMine(null);
        if (showCount) setLocalCount(c => (c ?? count) - 1);
        await unreact({ commentId: comment._id, userId: myUserId });
      } else {
        setLocalMine("👍");
        if (showCount) setLocalCount(c => (c ?? count) + 1);
        await react({ commentId: comment._id, emoji: "👍", userId: myUserId });
      }
    } finally {
      lockRef.current = false;
      onChanged?.();
    }
  }

  // prefer server populated user object if present, else resolve from map
  const enriched = useMemo(() => {
    return likers.map(r => {
      const uobj =
        (r?.user && typeof r.user === "object" ? r.user : null) ||
        (r?.userId && typeof r.userId === "object" ? r.userId : null);

      if (uobj) {
        return {
          id: String(uobj._id || uobj.id || ""),
          name: uobj.name || uobj.fullName || "User",
          email: uobj.email || "",
          avatarUrl: uobj.profilePicture || uobj.avatarUrl || "",
        };
      }

      const uid = getReactorId(r);
      const u = userMap.get(uid);
      return {
        id: uid,
        name: u?.name || "User",
        email: u?.email || "",
        avatarUrl: u?.avatarUrl || "",
      };
    });
  }, [likers, userMap]);

  // close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors
          ${active
            ? "border-yellow-500 bg-yellow-600/10 text-yellow-600 dark:border-yellow-500 dark:bg-yellow-500/10 dark:text-yellow-300"
            : "border-[#e5e5e5] text-gray-400 hover:text-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:text-gray-200"}`}
        aria-label="Like"
        title={active ? "Unlike" : "Like"}
      >
        <span role="img" aria-label="thumb">👍</span>
        <span>{active ? "Liked" : "Like"}</span>

        {displayCount > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="ml-1 text-gray-400 hover:underline underline cursor-pointer"
            title="View who liked"
          >
            {displayCount}
          </button>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div
            className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-xl
                       bg-[#fafafa] dark:bg-[#1e1e1e] rounded-2xl shadow-2xl
                       border border-[#e5e5e5] dark:border-gray-700"
            role="dialog"
            aria-modal="true"
          >
            <div className="sticky top-0 flex items-center justify-between gap-3 px-4 py-3
                            border-b border-[#e5e5e5] dark:border-gray-700">
              <div className="text-sm font-semibold text-black dark:text-white">
                Likes <span className="font-normal text-gray-500">({enriched.length})</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 hover:bg-[#e5e5e5] dark:hover:bg-[#2a2a2a]"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto">
              {enriched.length === 0 ? (
                <div className="px-4 py-8 text-sm text-gray-500">No likes yet</div>
              ) : (
                <ul className="divide-y divide-[#e5e5e5] dark:divide-gray-800">
                  {enriched.map(u => (
                    <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={u.avatarUrl} alt={u.name} />
                        <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm text-black dark:text-white">{u.name}</div>
                        {u.email && (
                          <div className="truncate text-[11px] text-gray-600 dark:text-gray-400">{u.email}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
























// import React, { useMemo, useRef, useState } from "react";
// import { useReactComment, useUnreactComment } from "../../hooks/useCommentService";

// export default function Thumb({ comment, myUserId, onChanged, showCount = false }) {
//   const { mutateAsync: react } = useReactComment();
//   const { mutateAsync: unreact } = useUnreactComment();
//   const lockRef = useRef(false);

//   const { mine, count } = useMemo(() => {
//     const list = Array.isArray(comment.reactions) ? comment.reactions : [];
//     const mine = list.find((r) => String(r.user || r.userId) === String(myUserId))?.emoji;
//     const count = list.filter((r) => r.emoji === "👍").length;
//     return { mine, count };
//   }, [comment.reactions, myUserId]);

//   const [localMine, setLocalMine] = useState(null);
//   const [localCount, setLocalCount] = useState(null);

//   const active = (localMine ?? mine) === "👍";
//   const displayCount = showCount ? localCount ?? count : null;

//   async function toggle() {
//     if (lockRef.current || !myUserId) return;
//     lockRef.current = true;

//     try {
//       if (active) {
//         // Unlike
//         setLocalMine(null);
//         if (showCount) setLocalCount((c) => (c ?? count) - 1);
//         await unreact({ commentId: comment._id, userId: myUserId });
//       } else {
//         // Like
//         setLocalMine("👍");
//         if (showCount) setLocalCount((c) => (c ?? count) + 1);
//         await react({ commentId: comment._id, emoji: "👍", userId: myUserId });
//       }
//     } finally {
//       lockRef.current = false;
//       onChanged?.();
//     }
//   }

//   return (
//     <button
//       onClick={toggle}
//       className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors
//         ${active ? "border-yellow-500 bg-yellow-600/10 text-yellow-600 dark:border-yellow-500 dark:bg-yellow-500/10 dark:text-yellow-300"
//                  : "border-[#e5e5e5] text-gray-400 hover:text-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:text-gray-200"}`}
//       aria-label="Like"
//       title={active ? "Unlike" : "Like"}
//     >
//       <span role="img" aria-label="thumb">👍</span>
//       <span>{active ? "Liked" : "Like"}</span>
//       {/* {displayCount !== null && <span className="text-gray-400">{displayCount}</span>} */}
//       {displayCount > 0 && (
//         <span className="text-gray-400">{displayCount}</span>
//         )}
//     </button>
//   );
// }































// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useReactComment, useUnreactComment } from "../../hooks/useCommentService";

// export default function Thumb({ comment, myUserId, onChanged, showCount = false }) {
//   const { mutateAsync: react } = useReactComment();
//   const { mutateAsync: unreact } = useUnreactComment();
//   const lockRef = useRef(false);

//   const { mine, count } = useMemo(() => {
//     const list = Array.isArray(comment.reactions) ? comment.reactions : [];
//     const mine = list.find((r) => String(r.user || r.userId) === String(myUserId))?.emoji;
//     const count = list.filter((r) => r.emoji === "👍").length;
//     return { mine, count };
//   }, [comment.reactions, myUserId]);

//   const [localMine, setLocalMine] = useState(null);
//   const [localCount, setLocalCount] = useState(null);
//   useEffect(() => {
//     setLocalMine(null);
//     setLocalCount(null);
//   }, [comment._id, count, mine]);

//   const active = (localMine ?? mine) === "👍";
//   const displayCount = showCount ? localCount ?? count : null;

//   async function toggle() {
//     if (lockRef.current || !myUserId) return;
//     lockRef.current = true;

//     try {
//       if (active) {
//         setLocalMine(null);
//         if (showCount) setLocalCount((c) => (c ?? count) - 1);
//         await unreact({ commentId: comment._id, emoji: "👍", userId: myUserId });
//       } else {
//         setLocalMine("👍");
//         if (showCount) setLocalCount((c) => (c ?? count) + 1);
//         if (mine && mine !== "👍") {
//           try {
//             await unreact({ commentId: comment._id, emoji: mine, userId: myUserId });
//           } catch {
//             // ignore
//           }
//         }
//         await react({ commentId: comment._id, emoji: "👍", userId: myUserId });
//       }
//     } finally {
//       lockRef.current = false;
//       onChanged?.();
//     }
//   }

//   return (
//     <button
//       onClick={toggle}
//       className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors
//         ${active ? "border-yellow-500 bg-yellow-500/10 text-yellow-300"
//                  : "border-gray-700 text-gray-300 hover:text-gray-200"}`}
//       aria-label="Like"
//       title={active ? "Unlike" : "Like"}
//     >
//       <span role="img" aria-label="thumb">👍</span>
//       <span>{active ? "Liked" : "Thumb"}</span>
//       {displayCount !== null && <span className="text-gray-400">({displayCount})</span>}
//     </button>
//   );
// }





























// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useReactComment, useUnreactComment } from "../../hooks/useCommentService";

// export default function Thumb({ comment, myUserId, onChanged, showCount = false }) {
//   const { mutateAsync: react } = useReactComment();
//   const { mutateAsync: unreact } = useUnreactComment();
//   const lockRef = useRef(false);

//   const { mine, count } = useMemo(() => {
//     const list = Array.isArray(comment.reactions) ? comment.reactions : [];
//     const mine = list.find(
//       (r) => String(r.user || r.userId) === String(myUserId)
//     )?.emoji;
//     const count = list.filter((r) => r.emoji === "👍").length;
//     return { mine, count };
//   }, [comment.reactions, myUserId]);

//   const [localMine, setLocalMine] = useState(null);
//   const [localCount, setLocalCount] = useState(null);
//   useEffect(() => {
//     setLocalMine(null);
//     setLocalCount(null);
//   }, [comment._id, count, mine]);

//   const active = (localMine ?? mine) === "👍";
//   const displayCount = showCount ? localCount ?? count : null;

//   async function toggle() {
//     if (lockRef.current || !myUserId) return;
//     lockRef.current = true;

//     try {
//       if (active) {
//         setLocalMine(null);
//         if (showCount) setLocalCount((c) => (c ?? count) - 1);
//         await unreact({ commentId: comment._id, emoji: "👍", user: myUserId });
//       } else {
//         setLocalMine("👍");
//         if (showCount) setLocalCount((c) => (c ?? count) + 1);
//         if (mine && mine !== "👍") {
//           try {
//             await unreact({ commentId: comment._id, emoji: mine, user: myUserId });
//           } catch {
//             // ignore
//           }
//         }
//         await react({ commentId: comment._id, emoji: "👍", user: myUserId });
//       }
//     } finally {
//       lockRef.current = false;
//       onChanged?.();
//     }
//   }

//   return (
//     <button
//       onClick={toggle}
//       className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors
//         ${active
//           ? "border-yellow-500 bg-yellow-500/10 text-yellow-300"
//           : "border-gray-700 text-gray-300 hover:text-gray-200"
//         }`}
//       aria-label="Like"
//       title={active ? "Unlike" : "Like"}
//     >
//       <span role="img" aria-label="thumb">👍</span>
//       <span>{active ? "Liked" : "Thumb"}</span>
//       {displayCount !== null && <span className="text-gray-400">({displayCount})</span>}
//     </button>
//   );
// }
