import React, { useEffect, useMemo, useRef, useState } from "react";
import useMe from "./useMe";
import { Avatar, AvatarImage, AvatarFallback } from "../form/avatar"; // path adjust if needed
import { getInitials } from "../../utils/index"; // path adjust if needed

export default function MentionInput({
  value,
  onChange,
  onMentionsChange,
  placeholder,
  rows = 3,
  users, // optional external list
  className = "w-full rounded-md border border-[#f2f2f2] bg-[#e5e5e5] dark:border-[#242424] dark:bg-[#202020] text-sm text-black dark:text-white placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600",
}) {
  const me = useMe();

  // prefer external users, else me.members
  const members = useMemo(
    () => (Array.isArray(users) && users.length ? users : me.members || []),
    [users, me.members]
  );

  // panel state
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  // normalize and index once
  const index = useMemo(() => {
    return (members || []).map(u => ({
      ...u,
      id: String(u?.id ?? u?._id ?? u?.userId ?? ""), // canonical id
      _name: String(u?.name || "").toLowerCase(),
      _email: String(u?.email || "").toLowerCase(),
      _avatar: u?.avatarUrl || u?.profilePicture || "", // avatar url
    }));
  }, [members]);

  // parse text -> [{ userId }]
  function parse(text) {
    const found = Array.from(text.matchAll(/@([\w ]+)/g)).map(m => m[1].trim());
    const uniq = [...new Set(found.map(s => s.toLowerCase()))];
    return uniq
      .map(n => {
        const u = index.find(x => x._name === n);
        return u ? { userId: String(u.id) } : null;
      })
      .filter(Boolean);
  }

  function handleChange(e) {
    const v = e.target.value;
    onChange(v);
    onMentionsChange?.(parse(v));

    const caret = e.target.selectionStart ?? v.length;
    const before = v.slice(0, caret);

    // find the last "@word"
    const m = before.match(/(^|\s)@([^\s]*)$/i);
    const q = m ? m[2] || "" : "";
    setQuery(q);

    // open as soon as "@" appears
    setOpen(!!m && index.length > 0);
  }

  // empty query -> top 12, else filtered top 12
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.slice(0, 12);
    return index
      .filter(u => u._name.includes(q) || u._email.includes(q))
      .slice(0, 12);
  }, [index, query]);

  // total count in header
  const totalMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.length;
    return index.filter(u => u._name.includes(q) || u._email.includes(q)).length;
  }, [index, query]);

  function pick(u) {
    // replace only the last "@word"
    const replaced = value.replace(/(^|\s)@([^\s]*)$/i, (m, sp) => `${sp}@${u.name} `);
    onChange(replaced);
    onMentionsChange?.(parse(replaced));
    setOpen(false);
    setTimeout(() => ref.current?.focus(), 0);
  }

  // close on Escape
  useEffect(() => {
    function esc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);

  const hugeList = (members?.length || 0) > 50;

  return (
    <div className="relative">
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />

      {open && (
        <div
          className="absolute z-30 top-full mt-1 w-96 max-h-72 overflow-auto
                     rounded-xl border border-[#e5e5e5] bg-[#fafafa]
                     dark:border-gray-700 dark:bg-[#1e1e1e] shadow-xl"
        >
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-3 py-1
                       text-[11px] text-gray-400 bg-[#fafafa]
                       dark:bg-[#1e1e1e]/95 backdrop-blur"
          >
            <span>Results: {totalMatches}</span>
            <span>Type to narrow</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              {hugeList && query.length < 1 ? "Type at least 1 character after @" : "No matches"}
            </div>
          ) : (
            filtered.map(u => (
              <button
                key={u.id}
                onClick={() => pick(u)}
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm
                           hover:bg-[#e5e5e5] dark:hover:bg-[#2a2a2a]"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={u._avatar} alt={u.name} />
                  <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <div className="truncate text-black dark:text-white">@{u.name}</div>
                  {u.email && (
                    <div className="truncate text-[11px] text-gray-600 dark:text-gray-400">
                      {u.email}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}


























// import React, { useEffect, useMemo, useRef, useState } from "react";
// import useMe from "./useMe";

// export default function MentionInput({
//   value,
//   onChange,
//   onMentionsChange,
//   placeholder,
//   rows = 3,
//   users, // optional external list
//   className = "w-full rounded-md border border-[#f2f2f2] bg-[#e5e5e5] dark:border-[#242424] dark:bg-[#202020] text-sm text-black dark:text-white placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600",
// }) {
//   const me = useMe();

//   // Prefer external users, else me.members
//   const members = useMemo(
//     () => (Array.isArray(users) && users.length ? users : me.members || []),
//     [users, me.members]
//   );

//   // Jira-like behavior: require at least 1 character after '@' to open the list
//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState("");
//   const ref = useRef(null);

//   // Build a compact search index once
//   const index = useMemo(() => {
//     return (members || []).map(u => ({
//       ...u,
//       _name: (u.name || "").toLowerCase(),
//       _email: (u.email || "").toLowerCase(),
//     }));
//   }, [members]);

//   // Parse mentions to simple structure
//   function parse(text) {
//     const found = Array.from(text.matchAll(/@([\w ]+)/g)).map(m => m[1].trim());
//     const uniq = [...new Set(found.map(s => s.toLowerCase()))];
//     return uniq
//       .map(n => {
//         const u = index.find(x => x._name === n);
//         return u ? { userId: u.id } : null;
//       })
//       .filter(Boolean);
//   }

//   function handleChange(e) {
//     const v = e.target.value;
//     onChange(v);
//     onMentionsChange?.(parse(v));

//     // Everything before caret
//     const caret = e.target.selectionStart ?? v.length;
//     const before = v.slice(0, caret);

//     // Match the very last "@something"
//     const m = before.match(/(^|\s)@([^\s]*)$/i);
//     const q = m ? m[2] || "" : "";
//     setQuery(q);

//     // Open only when at least 1 char typed after "@"
//     setOpen(!!m && q.length >= 1 && index.length > 0);
//   }

//   const filtered = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     if (!q) return [];
//     // Search both name and email like Jira does
//     const results = index.filter(
//       u => u._name.includes(q) || u._email.includes(q)
//     );
//     // Show first 12 in the panel, keep it scrollable
//     return results.slice(0, 12);
//   }, [index, query]);

//   const totalMatches = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     if (!q) return 0;
//     return index.filter(u => u._name.includes(q) || u._email.includes(q)).length;
//   }, [index, query]);

//   function pick(u) {
//     // Replace the last "@word"
//     const replaced = value.replace(/(^|\s)@([^\s]*)$/i, (m, sp) => `${sp}@${u.name} `);
//     onChange(replaced);
//     onMentionsChange?.(parse(replaced));
//     setOpen(false);
//     setTimeout(() => ref.current?.focus(), 0);
//   }

//   useEffect(() => {
//     function esc(e) {
//       if (e.key === "Escape") setOpen(false);
//     }
//     document.addEventListener("keydown", esc);
//     return () => document.removeEventListener("keydown", esc);
//   }, []);

//   const hugeList = (members?.length || 0) > 50;

//   return (
//     <div className="relative">
//       <textarea
//         ref={ref}
//         rows={rows}
//         value={value}
//         onChange={handleChange}
//         placeholder={placeholder}
//         className={className}
//       />
//       {open && (
//         <div className="absolute z-30 top-full mt-1 w-96 max-h-72 overflow-auto rounded-xl border border-[#e5e5e5] bg-[#fafafa] dark:border-gray-700 dark:bg-[#1e1e1e] shadow-xl">
//           <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-1 text-[11px] text-gray-400 bg-[#fafafa] dark:bg-[#1e1e1e]/95 backdrop-blur">
//             <span>Results: {totalMatches}</span>
//             <span>Type to narrow</span>
//           </div>

//           {filtered.length === 0 ? (
//             <div className="px-3 py-2 text-sm text-gray-400">
//               {hugeList && query.length < 1
//                 ? "Type at least 1 character after @"
//                 : "No matches"}
//             </div>
//           ) : (
//             filtered.map(u => (
//               <button
//                 key={u.id}
//                 onClick={() => pick(u)}
//                 type="button"
//                 className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[#e5e5e5] dark:hover:bg-[#2a2a2a]"
//               >
//                 <img
//                   src={u.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${u.name}`}
//                   className="h-7 w-7 rounded-full "
//                   alt=""
//                 />
//                 <div className="min-w-0">
//                   <div className="truncate text-black dark:text-white">@{u.name}</div>
//                   {u.email && <div className="truncate text-[11px] text-gray-600 dark:text-gray-400">{u.email}</div>}
//                 </div>
//               </button>
//             ))
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

























// import React, { useEffect, useRef, useState, useMemo } from "react";
// import useMe from "./useMe";

// export default function MentionInput({
//   value,
//   onChange,
//   onMentionsChange,
//   placeholder,
//   rows = 3,
//   users, // optional external list
//   className = "w-full rounded-md border border-gray-700 bg-[#141414] text-sm text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600",
// }) {
//   const me = useMe();
//   const members = useMemo(
//     () => (Array.isArray(users) && users.length ? users : me.members || []),
//     [users, me.members]
//   );

//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState("");
//   const ref = useRef(null);

//   // parse mentions to structured form
//   function parse(text) {
//     const found = Array.from(text.matchAll(/@([\w ]+)/g)).map((m) => m[1].trim());
//     const uniq = [...new Set(found.map((s) => s.toLowerCase()))];
//     return uniq
//       .map((n) => {
//         const u = (members || []).find((x) => x.name.toLowerCase() === n);
//         return u ? { userId: u.id } : null;
//       })
//       .filter(Boolean);
//   }

//   function handleChange(e) {
//     const v = e.target.value;
//     onChange(v);
//     onMentionsChange?.(parse(v));

//     const before = v.slice(0, e.target.selectionStart ?? v.length);
//     // open on "@" and keep filtering as user types (jira-like)
//     const m = before.match(/(^|\s)@([^\s]*)$/i);
//     setOpen(!!m && (members?.length || 0) > 0);
//     setQuery(m ? m[2] || "" : "");
//   }

//   const filtered = useMemo(() => {
//     const q = (query || "").trim().toLowerCase();
//     const list = Array.isArray(members) ? members : [];
//     if (!q) return list.slice(0, 8);
//     return list.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 8);
//   }, [members, query]);

//   function pick(u) {
//     // replace only the last "@word"
//     const replaced = value.replace(/(^|\s)@([^\s]*)$/i, (m, sp) => `${sp}@${u.name} `);
//     onChange(replaced);
//     onMentionsChange?.(parse(replaced));
//     setOpen(false);
//     setTimeout(() => ref.current?.focus(), 0);
//   }

//   useEffect(() => {
//     function esc(e) {
//       if (e.key === "Escape") setOpen(false);
//     }
//     document.addEventListener("keydown", esc);
//     return () => document.removeEventListener("keydown", esc);
//   }, []);

//   return (
//     <div className="relative">
//       <textarea
//         ref={ref}
//         rows={rows}
//         value={value}
//         onChange={handleChange}
//         placeholder={placeholder}
//         className={className}
//       />
//       {open && filtered.length > 0 && (
//         <div className="absolute z-30 top-full mt-1 w-80 max-h-64 overflow-auto rounded-xl border border-gray-700 bg-[#1e1e1e] shadow-xl">
//           {filtered.map((u) => (
//             <button
//               key={u.id}
//               onClick={() => pick(u)}
//               type="button"
//               className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[#2a2a2a]"
//             >
//               <img
//                 src={u.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${u.name}`}
//                 className="h-6 w-6 rounded-full"
//                 alt=""
//               />
//               <span className="truncate">@{u.name}</span>
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }




























// import React, { useEffect, useRef, useState } from "react";
// import useMe from "./useMe";

// export default function MentionInput({
//   value,
//   onChange,
//   onMentionsChange,
//   placeholder,
//   rows = 3,
//   className = "w-full rounded-md border border-gray-700 bg-[#141414] text-sm text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600",
// }) {
//   const { members } = useMe();
//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState("");
//   const ref = useRef(null);

//   function parse(text) {
//     const found = Array.from(text.matchAll(/@([\w ]+)/g)).map((m) =>
//       m[1].trim().toLowerCase()
//     );
//     const uniq = [...new Set(found)];
//     return uniq
//       .map((n) => {
//         const u = members.find((x) => x.name.toLowerCase() === n);
//         return u ? { userId: u.id, offset: 0, length: n.length } : null;
//       })
//       .filter(Boolean);
//   }

//   function handleChange(e) {
//     const v = e.target.value;
//     onChange(v);
//     onMentionsChange?.(parse(v));
//     const before = v.slice(0, e.target.selectionStart);
//     const m = before.match(/@([a-z0-9_ ]*)$/i);
//     setOpen(!!m && members.length > 0);
//     setQuery(m ? m[1] || "" : "");
//   }

//   const filtered = (query || "").trim()
//     ? members
//         .filter((u) =>
//           u.name.toLowerCase().includes(query.trim().toLowerCase())
//         )
//         .slice(0, 6)
//     : members.slice(0, 6);

//   function pick(u) {
//     const replaced = value.replace(/@([a-z0-9_ ]*)$/i, `@${u.name} `);
//     onChange(replaced);
//     onMentionsChange?.(parse(replaced));
//     setOpen(false);
//     setTimeout(() => ref.current?.focus(), 0);
//   }

//   useEffect(() => {
//     function esc(e) {
//       if (e.key === "Escape") setOpen(false);
//     }
//     document.addEventListener("keydown", esc);
//     return () => document.removeEventListener("keydown", esc);
//   }, []);

//   return (
//     <div className="relative">
//       <textarea
//         ref={ref}
//         rows={rows}
//         value={value}
//         onChange={handleChange}
//         placeholder={placeholder}
//         className={className}
//       />
//       {open && filtered.length > 0 && (
//         <div className="absolute z-30 top-full mt-1 w-72 rounded-xl border border-gray-700 bg-[#1e1e1e] shadow-xl overflow-hidden">
//           {filtered.map((u) => (
//             <button
//               key={u.id}
//               onClick={() => pick(u)}
//               type="button"
//               className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[#2a2a2a]"
//             >
//               <img
//                 src={
//                   u.avatarUrl ||
//                   `https://api.dicebear.com/8.x/initials/svg?seed=${u.name}`
//                 }
//                 className="h-6 w-6 rounded-full"
//                 alt=""
//               />
//               <span>@{u.name}</span>
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
