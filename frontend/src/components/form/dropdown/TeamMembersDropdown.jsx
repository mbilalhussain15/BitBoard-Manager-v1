// TeamMembersDropdown.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown } from "react-icons/fi";
import { MdCheck } from "react-icons/md";

/* ───────── Searchable Role Select (ALWAYS below, ≥3 items visible, no bottom-touch) ───────── */
/* ---------- Searchable Role Select (ALWAYS below; no flip) ---------- */
/* ---------- RoleSelect (ALWAYS below + show ≥3 items before scroll) ---------- */
const RoleSelect = ({ value = "contributor", onChange = () => {}, portalEl }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const headerRef = useRef(null);
  const searchRef = useRef(null);

  const OPTIONS = useMemo(
    () => [
      { label: "Manager", value: "manager" },
      { label: "Contributor", value: "contributor" },
      { label: "Viewer", value: "viewer" },
     
    ],
    []
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return OPTIONS;
    return OPTIONS.filter((o) => o.label.toLowerCase().includes(t));
  }, [q, OPTIONS]);

  // layout constants
  const ROW_H = 40;              // approx row height
  const MIN_ROWS = 3;            // at least 3 rows visible
  const PAD = 8;                 // padding from popup edges
  const GAP = 8;                 // distance from button
  const EXTRA = 8;               // bottom padding inside list

  // position + sizing inside popup overlay
  const [pos, setPos] = useState({
    top: 0,
    left: 0,
    width: 220,
    listMax: ROW_H * MIN_ROWS,
    listMin: ROW_H * MIN_ROWS,
  });

  // ALWAYS place BELOW; shift up only to keep inside popup, never above button
  const place = () => {
    if (!btnRef.current || !portalEl) return;
    const btn = btnRef.current.getBoundingClientRect();
    const layer = portalEl.getBoundingClientRect();

    const portalW = layer.width;
    const width = Math.min(320, Math.max(200, Math.min(btn.width, Math.floor(portalW * 0.92))));

    let left = btn.right - layer.left - width;
    left = Math.min(Math.max(left, PAD), portalW - width - PAD);

    const minTop = btn.bottom - layer.top + GAP;   // must stay below trigger
    let top = minTop;

    // target panel height = header + 3 rows + padding
    const headerApprox = 44;
    const desiredPanel = headerApprox + ROW_H * MIN_ROWS + EXTRA;

    const bottomLimit = layer.height - PAD;
    // if desired panel would touch bottom, shift up (but never above minTop)
    if (top + desiredPanel > bottomLimit) {
      const shift = top + desiredPanel - bottomLimit;
      top = Math.max(minTop, top - shift);
    }

    // compute list sizes with header approximation
    const availableBelow = Math.max(0, bottomLimit - top);
    const listMax = Math.max(ROW_H * MIN_ROWS, Math.min(360, availableBelow - headerApprox - EXTRA));

    setPos({
      top,
      left,
      width,
      listMax,
      listMin: ROW_H * MIN_ROWS, // hard guarantee: show ≥ 3 rows
    });
  };

  // refine using the actual header height (keeps top fixed)
  const refineAfterMount = () => {
    if (!portalEl) return;
    const layer = portalEl.getBoundingClientRect();
    const bottomLimit = layer.height - PAD;
    const headerH = headerRef.current?.offsetHeight ?? 44;
    const availableBelow = Math.max(0, bottomLimit - pos.top);
    const listMax = Math.max(ROW_H * MIN_ROWS, Math.min(360, availableBelow - headerH - EXTRA));
    setPos((p) => ({ ...p, listMax }));
  };

  // close on outside / ESC
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (panelRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onEsc = (e) => open && e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    place();
    const t = setTimeout(() => {
      searchRef.current?.focus();
      refineAfterMount();
    }, 15);
    const onResize = () => place();
    const onScroll = () => place();
    window.addEventListener("resize", onResize);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, portalEl]);

  const currentLabel = OPTIONS.find((o) => o.value === value)?.label ?? "Role";

  const menu = (
    <div
      ref={panelRef}
      className="pointer-events-auto rounded-xl border shadow-xl ring-1 ring-black/5
                 bg-white text-gray-900 border-gray-200
                 dark:bg-gray-800 dark:text-white dark:border-gray-700 overflow-hidden"
      style={{ position: "absolute", top: pos.top, left: pos.left, width: pos.width, zIndex: 5 }}
    >
      {/* sticky search */}
      <div
        ref={headerRef}
        className="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800"
      >
        <input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search role…"
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-1.5
                     focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
        />
      </div>

      {/* options — guarantee ≥3 visible, then scroll */}
      <ul
        className="p-1 overflow-y-auto"
        style={{ maxHeight: pos.listMax, minHeight: pos.listMin }}
      >
        {filtered.length === 0 && <li className="px-3 py-2 text-sm opacity-70">No roles</li>}
        {filtered.map((opt, index) => {
          const active = opt.value === value;
          return (
            <li key={`${opt.value}-${index}`}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  btnRef.current?.focus();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md
                           hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className={active ? "font-medium" : ""}>{opt.label}</span>
                {active && <MdCheck className="h-4 w-4 opacity-90" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs
                   bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-100
                   dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600
                   focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-green-500"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {currentLabel}
        <FiChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* render INSIDE popup overlay layer (rolePortalRef) */}
      {open && portalEl
        ? createPortal(menu, portalEl)
        : open && <div className="absolute right-0 top-full mt-1">{menu}</div>}
    </div>
  );
};



/* ─────────────────────────────── Members Dropdown (same as before) ─────────────────────────────── */
const TeamMembersDropdown = ({
  workspaceMembers = [],
  value = [],
  onChange = () => {},
  label = "Members",
  placeholder = "Select Members",
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [panelW, setPanelW] = useState(0);
  const [mounted, setMounted] = useState(false);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const rolePortalRef = useRef(null); // overlay layer inside popup for role menus

 
  // Outside click / ESC (ignore clicks in role portal)
  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (rolePortalRef.current?.contains(e.target)) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // Match panel width to trigger
  const measure = () => {
    if (triggerRef.current) setPanelW(triggerRef.current.offsetWidth);
  };
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (triggerRef.current) ro.observe(triggerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect?.();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Autofocus + scrollIntoView on open
  useEffect(() => {
    if (open) {
      setMounted(true);
      const t = setTimeout(() => {
        searchRef.current?.focus();
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 20);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [open]);

  // Filter members
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return workspaceMembers;
    return workspaceMembers.filter((m) =>
      (m?.user?.name || "").toLowerCase().includes(term)
    );
  }, [workspaceMembers, q]);

  // Selection helpers
  const isChecked = (userId) => value.some((v) => v.user === userId);
  const roleOf = (userId) =>
    value.find((v) => v.user === userId)?.role || "contributor";

  const toggleMember = (member, checked) => {
    const uViewId = member?.user?._id;
    const realUserId = member?.userId;
    
    if (!uViewId) return;
    if (checked) onChange([...value, { user: uViewId, userId: realUserId, role: "contributor" }]);
    else onChange(value.filter((v) => v.user !== uViewId));
  };

  const changeRole = (member, role) => {
    const uViewId  = member?.user?._id;
    if (!uViewId ) return;
    const next = value.map((v) => (v.user === uViewId  ? { ...v, role } : v));
    onChange(next);
  };

  const summaryText =
    value.length === 0
      ? placeholder
      : value.length <= 2
      ? value
          .map((sel) => {
            const wm = workspaceMembers.find((m) => m?.user?._id === sel.user);
            return wm ? `${wm.user.name} (${sel.role})` : sel.user;
          })
          .join(", ")
      : `${value.length} members selected`;

  return (
    <div className="w-full relative" ref={rootRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`w-full min-h-11 px-4 py-2.5 text-left rounded-lg border
          bg-gray-50 border-gray-300 text-gray-900
          focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
          dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-green-500
          flex items-center justify-between`}
      >
        <span className={value.length === 0 ? "text-gray-500" : ""}>
          {summaryText}
        </span>
        <FiChevronDown
          className={`h-5 w-5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popup panel */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2" style={{ width: panelW }}>
          <div
            ref={panelRef}
            className={`relative rounded-xl border shadow-xl ring-1 ring-black/5
                        bg-white text-gray-900 border-gray-200
                        dark:bg-gray-800 dark:text-white dark:border-gray-700
                        origin-top transition-all duration-150 ease-out
                        ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          >
            {/* Sticky search */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl">
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search members..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-2
                           focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
            </div>

            {/* Members list */}
            <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-2">
              {filtered.length === 0 && (
                <div className="text-sm opacity-70 px-1 py-2">No members found</div>
              )}

              {filtered.map((member) => {
                const uid = member?.user?._id;
                const uname = member?.user?.name || "Unknown";
                const checked = isChecked(uid);

                return (
                  <div
                    key={member?._id || uid}
                    className="relative flex items-center gap-2 p-2 border rounded-lg border-gray-200 dark:border-gray-700"
                  >
                    <input
                      id={`member-${uid}`}
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={(e) => toggleMember(member, e.target.checked)}
                    />
                    <label htmlFor={`member-${uid}`} className="truncate flex-1 text-sm">
                      {uname}
                    </label>

                    {checked && (
                      <RoleSelect
                        value={roleOf(uid)}
                        onChange={(role) => changeRole(member, role)}
                        portalEl={rolePortalRef.current} // render OUTSIDE row, INSIDE popup
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Portal layer for role menus (inside popup) */}
            <div ref={rolePortalRef} className="pointer-events-none absolute inset-0 z-50" />

            {/* Footer */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm border
                           bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-100
                           dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600
                           focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-green-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembersDropdown;






























// // TeamMembersDropdown.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { FiChevronDown } from "react-icons/fi";

// /**
//  * Props:
//  * - workspaceMembers: Array<{ _id: string, user: { _id: string, name: string }, role?: string }>
//  * - value: Array<{ user: string, role: "manager"|"contributor"|"viewer" }>
//  * - onChange: (next) => void
//  * - label?: string
//  * - placeholder?: string
//  */
// const TeamMembersDropdown = ({
//   workspaceMembers = [],
//   value = [],
//   onChange = () => {},
//   label = "Members",
//   placeholder = "Select Members",
// }) => {
//   const [open, setOpen] = useState(false);
//   const [q, setQ] = useState("");
//   const [panelW, setPanelW] = useState(0);
//   const [mounted, setMounted] = useState(false); // for open animation

//   const rootRef = useRef(null);
//   const triggerRef = useRef(null);
//   const panelRef = useRef(null);
//   const searchRef = useRef(null);

//   // Close on outside click / ESC
//   useEffect(() => {
//     const onDocClick = (e) => {
//       if (!rootRef.current) return;
//       if (!rootRef.current.contains(e.target)) setOpen(false);
//     };
//     const onEsc = (e) => e.key === "Escape" && setOpen(false);
//     document.addEventListener("mousedown", onDocClick);
//     document.addEventListener("keydown", onEsc);
//     return () => {
//       document.removeEventListener("mousedown", onDocClick);
//       document.removeEventListener("keydown", onEsc);
//     };
//   }, []);

//   // Measure trigger width so panel matches exactly
//   const measure = () => {
//     if (triggerRef.current) setPanelW(triggerRef.current.offsetWidth);
//   };
//   useEffect(() => {
//     measure();
//     const ro = new ResizeObserver(measure);
//     if (triggerRef.current) ro.observe(triggerRef.current);
//     window.addEventListener("resize", measure);
//     return () => {
//       ro.disconnect?.();
//       window.removeEventListener("resize", measure);
//     };
//   }, []);

//   // Auto-focus search + ensure visible on open
//   useEffect(() => {
//     if (open) {
//       setMounted(true); // enables enter animation
//       // let panel mount before focusing/scrolling
//       const t = setTimeout(() => {
//         searchRef.current?.focus();
//         // scroll page so the whole panel is visible
//         panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
//       }, 30);
//       return () => clearTimeout(t);
//     } else {
//       setMounted(false);
//     }
//   }, [open]);

//   // Filter by name
//   const filtered = useMemo(() => {
//     const term = q.trim().toLowerCase();
//     if (!term) return workspaceMembers;
//     return workspaceMembers.filter((m) =>
//       (m?.user?.name || "").toLowerCase().includes(term)
//     );
//   }, [workspaceMembers, q]);

//   // Helpers for selected value
//   const isChecked = (userId) => value.some((v) => v.user === userId);
//   const roleOf = (userId) =>
//     value.find((v) => v.user === userId)?.role || "contributor";

//   const toggleMember = (member, checked) => {
//     const userId = member?.user?._id;
//     if (!userId) return;
//     if (checked) onChange([...value, { user: userId, role: "contributor" }]);
//     else onChange(value.filter((v) => v.user !== userId));
//   };

//   const changeRole = (member, role) => {
//     const userId = member?.user?._id;
//     if (!userId) return;
//     onChange(value.map((v) => (v.user === userId ? { ...v, role } : v)));
//   };

//   const summaryText =
//     value.length === 0
//       ? placeholder
//       : value.length <= 2
//       ? value
//           .map((sel) => {
//             const wm = workspaceMembers.find((m) => m?.user?._id === sel.user);
//             return wm ? `${wm.user.name} (${sel.role})` : sel.user;
//           })
//           .join(", ")
//       : `${value.length} members selected`;

//   return (
//     <div className="w-full relative" ref={rootRef}>
//       {label && (
//         <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
//           {label}
//         </label>
//       )}

//       {/* Trigger — neutral outline button (no green) */}
//       <button
//         ref={triggerRef}
//         type="button"
//         aria-haspopup="listbox"
//         aria-expanded={open}
//         onClick={() => setOpen((v) => !v)}
//         className={`w-full min-h-11 px-4 py-2.5 text-left rounded-lg border
//           bg-gray-50 border-gray-300 text-gray-900
//           focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
//           dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-green-500
//           flex items-center justify-between`}
//       >
//         <span className={value.length === 0 ? "text-gray-500" : ""}>
//           {summaryText}
//         </span>
//         <FiChevronDown
//           className={`h-5 w-5 transition-transform duration-200 ${
//             open ? "rotate-180" : ""
//           }`}
//         />
//       </button>

//       {/* Popover panel — width == trigger width */}
//       {open && (
//         <div className="absolute left-0 top-full z-50 mt-2" style={{ width: panelW }}>
//           <div
//             ref={panelRef}
//             className={`rounded-md border shadow-lg
//               bg-white text-gray-900 border-gray-200
//               dark:bg-gray-800 dark:text-white dark:border-gray-700
//               origin-top transition-all duration-150 ease-out
//               ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
//           >
//             {/* Search */}
//             <div className="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-md">
//               <input
//                 ref={searchRef}
//                 value={q}
//                 onChange={(e) => setQ(e.target.value)}
//                 placeholder="Search members..."
//                 className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-2
//                            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
//               />
//             </div>

//             {/* List */}
//             <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-2">
//               {filtered.length === 0 && (
//                 <div className="text-sm opacity-70 px-1 py-2">No members found</div>
//               )}

//               {filtered.map((member) => {
//                 const uid = member?.user?._id;
//                 const uname = member?.user?.name || "Unknown";
//                 const checked = isChecked(uid);

//                 return (
//                   <div
//                     key={member?._id || uid}
//                     className="flex items-center gap-2 p-2 border rounded border-gray-200 dark:border-gray-700"
//                   >
//                     <input
//                       id={`member-${uid}`}
//                       type="checkbox"
//                       className="h-4 w-4"
//                       checked={checked}
//                       onChange={(e) => toggleMember(member, e.target.checked)}
//                     />

//                     <label
//                       htmlFor={`member-${uid}`}
//                       className="truncate flex-1 text-sm"
//                     >
//                       {uname}
//                     </label>

//                     {checked && (
//                       <select
//                         className="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1
//                                    focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
//                         value={roleOf(uid)}
//                         onChange={(e) => changeRole(member, e.target.value)}
//                       >
//                         <option value="manager">Manager</option>
//                         <option value="contributor">Contributor</option>
//                         <option value="viewer">Viewer</option>
//                         <option value="manager">Manager</option>
//                         <option value="contributor">Contributor</option>
//                         <option value="viewer">Viewer</option>
//                         <option value="manager">Manager</option>
//                         <option value="contributor">Contributor</option>
//                         <option value="viewer">Viewer</option>
//                       </select>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>

//             {/* Footer */}
//             <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
//               <button
//                 type="button"
//                 onClick={() => setOpen(false)}
//                 className="px-3 py-2 rounded-md text-sm border
//                   bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-100
//                   dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600
//                   focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-green-500"
//               >
//                 Done
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TeamMembersDropdown;
























// // TeamMembersDropdown.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Button } from "../Button"; // NOTE: path sahi rakho (form/dropdown -> form/Button)

// import { FiChevronDown } from "react-icons/fi"; // top par import



// const TeamMembersDropdown = ({
//   workspaceMembers = [], // [{ _id, user: { _id, name }, role }]
//   value = [],            // [{ user: string, role: "manager"|"contributor"|"viewer" }]
//   onChange = () => {},
//   label = "Members",
//   placeholder = "Select Members",
// }) => {
//   const [open, setOpen] = useState(false);
//   const [q, setQ] = useState("");
//   const panelRef = useRef(null);

//   // Close on outside click / ESC
//   useEffect(() => {
//     const onDocClick = (e) => {
//       if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
//     };
//     const onEsc = (e) => e.key === "Escape" && setOpen(false);
//     document.addEventListener("mousedown", onDocClick);
//     document.addEventListener("keydown", onEsc);
//     return () => {
//       document.removeEventListener("mousedown", onDocClick);
//       document.removeEventListener("keydown", onEsc);
//     };
//   }, []);

//   // Filter by name
//   const filtered = useMemo(() => {
//     const term = q.trim().toLowerCase();
//     if (!term) return workspaceMembers;
//     return workspaceMembers.filter((m) =>
//       (m?.user?.name || "").toLowerCase().includes(term)
//     );
//   }, [workspaceMembers, q]);

//   const isChecked = (userId) => value.some((v) => v.user === userId);
//   const roleOf = (userId) =>
//     value.find((v) => v.user === userId)?.role || "contributor";

//   const toggleMember = (member, checked) => {
//     const userId = member?.user?._id;
//     if (!userId) return;
//     if (checked) {
//       const next = [...value, { user: userId, role: "contributor" }];
//       onChange(next);
//     } else {
//       const next = value.filter((v) => v.user !== userId);
//       onChange(next);
//     }
//   };

//   const changeRole = (member, role) => {
//     const userId = member?.user?._id;
//     if (!userId) return;
//     const next = value.map((v) => (v.user === userId ? { ...v, role } : v));
//     onChange(next);
//   };

//   const summaryText =
//     value.length === 0
//       ? placeholder
//       : value.length <= 2
//       ? value
//           .map((sel) => {
//             const wm = workspaceMembers.find((m) => m?.user?._id === sel.user);
//             return wm ? `${wm.user.name} (${sel.role})` : sel.user;
//           })
//           .join(", ")
//       : `${value.length} members selected`;

//   return (
//     <div className="w-full" ref={panelRef}>
//       {label && (
//         <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
//           {label}
//         </label>
//       )}

//       {/* Trigger */}
//       {/* <Button
//         variant="outline"
//         className="w-full justify-start text-left font-normal min-h-11"
//         onClick={() => setOpen((v) => !v)}
//         type="button"
//       >
//         {summaryText || <span className="text-gray-500">{placeholder}</span>}
//       </Button> */}

// <Button
//   variant="outline"
//   className="w-full justify-between text-left font-normal min-h-11"
//   onClick={() => setOpen((v) => !v)}
//   type="button"
// >
//   <span>{summaryText || <span className="text-gray-500">{placeholder}</span>}</span>
//   <FiChevronDown
//     className={`ml-2 h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
//   />
// </Button>




//       {/* Popover (custom) */}
//       {open && (
//         <div className="relative">
//           <div
//             className="absolute z-50 mt-2 w-full max-w-60 rounded-md border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg"
//             role="dialog"
//             aria-label="Members selector"
//           >
//             {/* Search */}
//             <div className="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
//               <input
//                 value={q}
//                 onChange={(e) => setQ(e.target.value)}
//                 placeholder="Search members..."
//                 className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-2
//                            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
//               />
//             </div>

//             {/* List */}
//             <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-2">
//               {filtered.length === 0 && (
//                 <div className="text-sm opacity-70 px-1 py-2">No members found</div>
//               )}

//               {filtered.map((member) => {
//                 const uid = member?.user?._id;
//                 const uname = member?.user?.name || "Unknown";
//                 const checked = isChecked(uid);

//                 return (
//                   <div
//                     key={member?._id || uid}
//                     className="flex items-center gap-2 p-2 border rounded border-gray-200 dark:border-gray-700"
//                   >
//                     <input
//                       id={`member-${uid}`}
//                       type="checkbox"
//                       className="h-4 w-4"
//                       checked={checked}
//                       onChange={(e) => toggleMember(member, e.target.checked)}
//                     />

//                     <label
//                       htmlFor={`member-${uid}`}
//                       className="truncate flex-1 text-sm"
//                     >
//                       {uname}
//                     </label>

//                     {checked && (
//                       <select
//                         className="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1
//                                    focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
//                         value={roleOf(uid)}
//                         onChange={(e) => changeRole(member, e.target.value)}
//                       >
//                         <option value="manager">Manager</option>
//                         <option value="contributor">Contributor</option>
//                         <option value="viewer">Viewer</option>
//                       </select>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>

//             <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
//               <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
//                 Done
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TeamMembersDropdown;
