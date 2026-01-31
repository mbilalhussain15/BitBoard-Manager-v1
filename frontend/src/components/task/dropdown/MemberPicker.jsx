// src/components/formInputs/MemberPicker.jsx
import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { BsChevronExpand } from "react-icons/bs";
import { MdCheck } from "react-icons/md";
import clsx from "clsx";
// adjust import path if your utils is elsewhere
import { getInitials } from "../../../utils";
import "./Dropdown.css";

/**
 * Generic MemberPicker
 * Props:
 *  members: array. Each item can be { user: <id|obj> } or a user object or an id string
 *  multiple: boolean. false = single select, true = multi select
 *  value: single => object|null, multi => array of objects
 *  onChange: single => (obj|null), multi => (arr)
 *  label: string heading
 *  placeholder: input placeholder
 *  enableUnassign: boolean. If true adds Unassign option at top
 */
export default function MemberPicker({
  members = [],
  multiple = false,
  value,
  onChange = () => {},
  label = "Members",
  placeholder = "Select member",
  enableUnassign = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // profile images that failed once will fallback to initials
  const [brokenKeys, setBrokenKeys] = useState(() => new Set());
  const markBroken = (id, url) => {
    const key = `${id}|${url || ""}`;
    setBrokenKeys(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  // normalize members → [{ _id, firstName, profileImage }]
  const options = useMemo(() => {
    if (!Array.isArray(members)) return [];
    const base = members
      .map((m) => {
        const u = m?.user ?? m; // object or string
        const id =
          (typeof u === "object" && (u._id || u.id)) ||
          (typeof u === "string" && u) ||
          m?._id ||
          null;
        if (!id) return null;

        const firstName =
          (typeof u === "object" &&
            (u.firstName || u.name || u.fullName || u.displayName)) ||
          (typeof u === "string" && u) ||
          "Unknown";

        const profileImage =
          (typeof u === "object" &&
            (u.profilePicture || u.profileImage || u.avatar || u.photoURL)) ||
          "";

        return { _id: String(id), firstName, profileImage };
      })
      .filter(Boolean);

    return enableUnassign
      ? [{ _id: "unassign", firstName: "Unassign", profileImage: "" }, ...base]
      : base;
  }, [members, enableUnassign]);

  // filter by search
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return options;
    return options.filter((u) => (u.firstName || "").toLowerCase().includes(q));
  }, [options, searchTerm]);

  // keep external value in sync if options refresh
  useEffect(() => {
    if (multiple) {
      if (!Array.isArray(value)) return;
      const map = new Map(options.map((o) => [o._id, o]));
      const next = value.map((v) => map.get(v?._id) || v).filter(Boolean);
      if (JSON.stringify(next.map((x) => x._id)) !== JSON.stringify(value.map((x) => x?._id))) {
        onChange(next);
      }
    } else {
      if (!value) return;
      const found = options.find((o) => o._id === value._id);
      if (found && (found.firstName !== value.firstName || found.profileImage !== value.profileImage)) {
        onChange(found);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length]);

  const buttonText = multiple
    ? (Array.isArray(value) && value.length ? value.map((u) => u.firstName).join(", ") : placeholder)
    : (value?.firstName || placeholder);

  const controlledValue = multiple ? (Array.isArray(value) ? value : []) : (value || null);

  return (
    <div>
      <p className="text-gray-700 dark:text-white">{label}</p>

      <Listbox value={controlledValue} onChange={onChange} multiple={multiple}>
        {({ open }) => (
          <>
            <Listbox.Button
              className="
                bg-white dark:bg-[#232325] dark:text-slate-100 rounded-md border
                border-slate-300 dark:border-zinc-700 relative w-full cursor-default
                pl-3 pr-10 text-left px-3 py-2.5 2xl:py-3 sm:text-sm"
            >
              <span className="block truncate">{buttonText}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <BsChevronExpand className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              as={Fragment}
              show={open}
              appear
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 transform scale-95"
              enterTo="opacity-100 transform scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 transform scale-100"
              leaveTo="opacity-0 transform scale-95"
              afterLeave={() => setSearchTerm("")}   // clear search when dropdown closes
            >
              <div className="relative">
                <Listbox.Options
                  className="
                    dropdown-menu bg-white dark:bg-zinc-800 dark:text-slate-100 rounded-md
                    z-50 relative mt-1 max-h-60 w-full overflow-auto py-1 text-base shadow-lg
                    border border-slate-200 dark:border-zinc-700 ring-1 ring-black/5 focus:outline-none sm:text-sm"
                >
                  <div className="p-2">
                    <input
                      type="text"
                      className="w-full p-2 border-b border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-slate-100 outline-none"
                      placeholder={`Search ${label.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {filtered.length === 0 ? (
                    <div className="py-2 px-4 text-gray-500 dark:text-slate-400">No results</div>
                  ) : (
                    filtered.map((user) => {
                      const imgKey = `${user._id}|${user.profileImage || ""}`;
                      const showImg = !!user.profileImage && !brokenKeys.has(imgKey);

                      return (
                        <Listbox.Option
                          key={user._id}
                          value={user}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? "bg-slate-100 dark:bg-zinc-700" : ""
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <div className={clsx("flex items-center gap-2 truncate", selected ? "font-medium" : "font-normal")}>
                                {showImg ? (
                                  <img
                                    src={user.profileImage}
                                    alt={user.firstName}
                                    className="w-6 h-6 rounded-full object-cover"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                    onError={() => setBrokenKeys(prev => new Set(prev).add(imgKey))}
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full text-white flex items-center justify-center bg-violet-600">
                                    <span className="text-center text-[10px]">{getInitials(user.firstName)}</span>
                                  </div>
                                )}
                                <span>{user.firstName}</span>
                              </div>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                  <MdCheck className="h-5 w-5" aria-hidden="true" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      );
                    })
                  )}
                </Listbox.Options>
              </div>
            </Transition>
          </>
        )}
      </Listbox>
    </div>
  );
}
