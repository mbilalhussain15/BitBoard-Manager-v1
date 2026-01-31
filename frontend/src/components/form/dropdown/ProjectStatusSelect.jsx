import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { MdCheck } from "react-icons/md";

/* helpers */
const toTitle = (s = "") =>
  s.toString().replace(/_/g, " ").trim().toLowerCase().replace(/\b\w/g, m => m.toUpperCase());
const toCode = (s = "") => s.toString().trim().replace(/\s+/g, "_").toUpperCase();

/** Normalize + de-dup: [{ id:'PLANNING', label:'Planning' }, ...] */
const normalizeStatusOptions = (options) => {
  const arr = Array.isArray(options) ? options : [];
  const mapped = arr
    .map((o) => {
      if (o && typeof o === "object") {
        const rawId = o.id ?? o.value ?? o.code ?? o.name ?? "";
        const rawLabel = o.label ?? o.value ?? o.name ?? "";
        const id = toCode(String(rawId || rawLabel));
        const label = rawLabel && /[a-z ]/.test(String(rawLabel))
          ? String(rawLabel)
          : toTitle(String(rawId || rawLabel));
        return id ? { id, label } : null;
      }
      const str = String(o);
      const looksLikeLabel = /[a-z ]/.test(str);
      return { id: toCode(str), label: looksLikeLabel ? str : toTitle(str) };
    })
    .filter(Boolean);

  const map = new Map();
  for (const it of mapped) if (!map.has(it.id)) map.set(it.id, it);
  return Array.from(map.values());
};

/** Searchable select. Returns LABEL (schema-friendly). */
export default function StatusSelect({ value, onChange, options = [] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const [panelW, setPanelW] = useState(0);

  const items = useMemo(() => normalizeStatusOptions(options), [options]);
  const current =
    items.find((i) => i.label === value) ||
    items.find((i) => i.id === value) ||
    null;

  // panel width == trigger width
  useEffect(() => {
    const measure = () => triggerRef.current && setPanelW(triggerRef.current.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    if (triggerRef.current) ro.observe(triggerRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect?.(); window.removeEventListener("resize", measure); };
  }, []);

  // outside click + ESC
  useEffect(() => {
    const onDoc = (e) => { if (!rootRef.current) return; if (!rootRef.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) => i.label.toLowerCase().includes(term));
  }, [items, q]);

  // show ≥3 items before scroll
  const ROW_H = 40;
  const minRows = Math.min(3, Math.max(1, filtered.length || items.length || 3));
  const listMin = ROW_H * minRows;
  const listMax = Math.max(listMin, Math.min(6 * ROW_H, window.innerHeight * 0.5));

  return (
    <div ref={rootRef} className="w-full relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-11 px-4 py-2.5 text-left rounded-lg border
                   bg-gray-50 border-gray-300 text-gray-900
                   focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                   dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-green-500
                   flex items-center justify-between"
      >
        <span className={!current ? "text-gray-500" : ""}>
          {current ? current.label : "Select Project Status"}
        </span>
        <FiChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2" style={{ width: panelW }}>
          <div className="rounded-xl border shadow-xl ring-1 ring-black/5
                          bg-white text-gray-900 border-gray-200
                          dark:bg-gray-800 dark:text-white dark:border-gray-700 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0">
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search status…"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-2
                           focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
            </div>

            {/* Options */}
            <ul className="p-1 overflow-y-auto" style={{ minHeight: listMin, maxHeight: listMax }}>
              {filtered.length === 0 && <li className="px-3 py-2 text-sm opacity-70">No results</li>}
              {filtered.map((opt) => {
                const active = opt.id === (current?.id ?? "");
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(opt.label); setOpen(false); triggerRef.current?.focus(); }}
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
        </div>
      )}
    </div>
  );
}
