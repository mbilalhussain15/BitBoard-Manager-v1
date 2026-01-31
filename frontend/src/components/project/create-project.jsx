import React, { useState, useEffect } from "react";
import ModalShell from "../form/ModalShell";
import CreateProjectManuall from "./tabs/create-Project-Manuall";
import CreateProjectAIPlanner from "./tabs/create-Project-AI-Planner";
import { useAuth } from "../../provider/auth-context";
import { Sparkles } from "lucide-react";

export default function CreateProjectDialogShell({
  isOpen,
  onOpenChange,
  workspaceId,
  workspaceMembers,
  mode = "create",       // "create" | "edit"
  initialData = null,
}) {
  const [footerNode, setFooterNode] = useState(null);
  const { user, logout } = useAuth();
  // create mode me default "manual", edit mode me bhi manual fixed
  const [activeTab, setActiveTab] = useState(mode === "edit" ? "manual" : "manual");

  // mode ya tab badle to footer clear
  useEffect(() => {
    setFooterNode(null);
  }, [activeTab, mode]);

  // tabs sirf create mode me
  const showTabs = mode !== "edit";



  const Tab = ({ id, label }) => {
    const active = activeTab === id;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => setActiveTab(id)}
        className={[
          "w-full py-3 rounded-lg border-2 text-sm font-semibold transition",
          active ? "border-white/80 bg-white/10" : "border-white/30 hover:border-white/60",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={() => onOpenChange?.(false)}
      title={mode === "edit" ? "Edit Project" : "Create Project"}
      footer={footerNode}
    >
      <div className="space-y-4">
        {showTabs && (
          <div role="tablist" className="grid grid-cols-2 gap-3 w-full">
            <Tab id="manual" label="Manual" />
            {/* <Tab id="ai" label="AI Planner agent" /> */}
            <Tab
              id="ai"
              label={
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={14} />
                  AI Planner Agent
                </span>
              }
            />
          </div>
        )}

        <div className="w-full transition-[min-height] duration-200 ease-out min-h-[520px]">
          {showTabs && activeTab === "ai" ? (
            <CreateProjectAIPlanner
              key="ai"
              setFooter={setFooterNode}
              workspaceId={workspaceId}
              user={user}
              onOpenChange={onOpenChange}
            />
          ) : (
            <CreateProjectManuall
              key="manual"
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              workspaceId={workspaceId}
              workspaceMembers={workspaceMembers}
              mode={mode}
              initialData={initialData}
              setFooter={setFooterNode}
            />
          )}
        </div>
      </div>
    </ModalShell>
  );
}




























// // create-project.jsx
// import React, { useEffect, useMemo, useContext } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Button } from "../form/Button";
// import { InputField } from "../form/InputField";
// import { TextareaInputField } from "../form/TextareaInputField";
// import TeamMembersDropdown from "../form/dropdown/TeamMembersDropdown";
// import StatusSelect from "../form/dropdown/ProjectStatusSelect";
// import ModalShell from "../form/ModalShell";

// import { projectSchema } from "../../lib/schema";
// import { UseCreateProject, UseUpdateProject } from "../../hooks/useProjectService";
// import { ProjectStatus } from "../../types";
// import { toast } from "sonner";
// import { useNavigate } from "react-router-dom";
// import { ProjectContext } from "../../context/ProjectContext";

// export default function CreateProjectDialog({
//   isOpen,
//   onOpenChange,
//   workspaceId,
//   workspaceMembers,
//   mode = "create",           // "create" | "edit"
//   initialData = null,        // project object when editing
// }) {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     reset,
//     setValue,
//     watch,
//   } = useForm({
//     resolver: projectSchema ? zodResolver(projectSchema) : undefined,
//     defaultValues: {
//       title: "",
//       description: "",
//       status: "Planning",
//       startDate: "",
//       dueDate: "",
//       members: [],
//       tags: "",
//     },
//   });

//   const navigate = useNavigate();

//   const projectCtx = useContext(ProjectContext) ?? {};
//   const { refetchProjects = () => {}, setCurrentProject = () => {}, setProjects = () => {} } = projectCtx;

//   const { mutateAsync: createAsync = async () => {}, isPending: createPending = false } =
//     (typeof UseCreateProject === "function" && UseCreateProject()) || {};

//   const { mutateAsync: updateAsync = async () => {}, isPending: updatePending = false } =
//     (typeof UseUpdateProject === "function" && UseUpdateProject()) || {};

//   // lock body scroll
//   useEffect(() => {
//     document.body.style.overflow = isOpen ? "hidden" : "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [isOpen]);

//   // when opening: prefill for edit, reset for create
//   useEffect(() => {
//     if (!isOpen) return;
//     if (mode === "edit" && initialData) {
//       // map: tags[] -> comma string; dates -> ISO; members keep as-is
//       reset({
//         title: initialData.title || "",
//         description: initialData.description || "",
//         status: initialData.status || "Planning",
//         startDate: initialData.startDate || "",
//         dueDate: initialData.dueDate || "",
//         members: Array.isArray(initialData.members) ? initialData.members : [],
//         tags: Array.isArray(initialData.tags) ? initialData.tags.join(",") : (initialData.tags || ""),
//       });
//     } else {
//       reset({
//         title: "",
//         description: "",
//         status: "Planning",
//         startDate: "",
//         dueDate: "",
//         members: [],
//         tags: "",
//       });
//     }
//   }, [isOpen, mode, initialData, reset]);

//   const startDate = watch("startDate");
//   const dueDate = watch("dueDate");
//   const statusValue = watch("status");
//   const membersValue = watch("members") || [];

//   const setMembers = (next) =>
//     setValue("members", next, { shouldValidate: true, shouldDirty: true });

//   const handleNativeDateChange = (name) => (e) => {
//     const v = e.target.value;
//     if (v) {
//       const iso = new Date(v + "T00:00:00").toISOString();
//       setValue(name, iso, { shouldValidate: true, shouldDirty: true });
//     } else {
//       setValue(name, "", { shouldValidate: true, shouldDirty: true });
//     }
//   };
//   const isoToDateInput = (iso) => {
//     if (!iso) return "";
//     try {
//       const d = new Date(iso);
//       const yyyy = d.getFullYear();
//       const mm = String(d.getMonth() + 1).padStart(2, "0");
//       const dd = String(d.getDate()).padStart(2, "0");
//       return `${yyyy}-${mm}-${dd}`;
//     } catch {
//       return "";
//     }
//   };

//   const statusOptions = useMemo(() => {
//     if (ProjectStatus && typeof ProjectStatus === "object") {
//       return Object.values(ProjectStatus);
//     }
//     return ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
//   }, []);

//   const sortByCreatedDesc = (a, b) =>
//     new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime();

//   const onSubmit = async (values) => {
//     if (mode === "create") {
//       if (!workspaceId) return;
//       const payload = {
//         ...values,
//         tags: Array.isArray(values.tags) ? values.tags.join(",") : (values.tags ?? ""),
//       };
//       try {
  

//         const created = await createAsync({ workspaceId, ...payload });
//         setProjects?.((prev) => [...(Array.isArray(prev) ? prev : []), created].sort(sortByCreatedDesc));
//         setCurrentProject?.(created);
//         toast?.success?.("Project created successfully");
//         onOpenChange?.(false);
//         reset();
//         await Promise.resolve(refetchProjects());
//         navigate(`/workspaces/${workspaceId}/projects`, { replace: true });
//       } catch (error) {
//         const msg = error?.response?.data?.message || "Something went wrong";
//         toast?.error?.(msg);
//       }
//     } else {
//       // EDIT
//       if (!initialData?._id) return;
//       console.log("Updating project ID: ", initialData._id);
//       const payload = {
//         ...values,
//         tags: Array.isArray(values.tags) ? values.tags : String(values.tags || ""),
//       };
//       try {
//         const updated = await updateAsync({ projectId: initialData._id, ...payload });
//         toast?.success?.("Project updated successfully");
//         onOpenChange?.(false);
//         reset();
//         await Promise.resolve(refetchProjects());
//         // optional: stay on same page
//       } catch (error) {
//         const msg = error?.response?.data?.message || "Something went wrong";
//         toast?.error?.(msg);
//       }
//     }
//   };

//   const isBusy = isSubmitting || createPending || updatePending;
//   const titleText = mode === "edit" ? "Edit Project" : "Create Project";
//   const btnText = mode === "edit" ? "Save Changes" : "Create Project";

//   return (
//     <ModalShell
//       isOpen={isOpen}
//       onClose={() => onOpenChange?.(false)}
//       title={titleText}
//       footer={
//         <Button type="submit" form="create-project-form" isLoading={isBusy}>
//           {btnText}
//         </Button>
//       }
//     >
//       <form id="create-project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <InputField label="Project Title" name="title" type="text" register={register} errors={errors} placeholder="Project Title" required />

//         <TextareaInputField label="Project Description" name="description" register={register} errors={errors} placeholder="Write project description" rows={3} />

//         <div className="space-y-2">
//           <label className="block text-sm font-medium">Project Status</label>
//           <StatusSelect
//             value={statusValue}
//             options={statusOptions}
//             onChange={(v) => setValue("status", v, { shouldValidate: true, shouldDirty: true })}
//           />
//           {errors?.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <label className="block text-sm font-medium">Start Date</label>
//             <input
//               type="date"
//               className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5"
//               value={isoToDateInput(startDate)}
//               onChange={handleNativeDateChange("startDate")}
//             />
//             {errors?.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
//           </div>
//           <div className="space-y-2">
//             <label className="block text-sm font-medium">Due Date</label>
//             <input
//               type="date"
//               className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5"
//               value={isoToDateInput(dueDate)}
//               onChange={handleNativeDateChange("dueDate")}
//             />
//             {errors?.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>}
//           </div>
//         </div>

//         <InputField label="Tags" name="tags" type="text" register={register} errors={errors} placeholder="comma,separated,tags" />

//         <TeamMembersDropdown
//           workspaceMembers={workspaceMembers || []}
//           value={membersValue}
//           onChange={setMembers}
//           label="Members"
//           placeholder="Select Members"
//         />
//       </form>
//     </ModalShell>
//   );
// }

































// import React, { useEffect, useMemo } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Button } from "../form/Button";
// import { InputField } from "../form/InputField";
// import { TextareaInputField } from "../form/TextareaInputField";
// import TeamMembersDropdown from "../form/dropdown/TeamMembersDropdown";
// import StatusSelect from "../form/dropdown/ProjectStatusSelect";
// import ModalShell from "../form/ModalShell";

// // OPTIONAL (adjust/remove if paths differ)
// import { projectSchema } from "../../lib/schema";
// import { UseCreateProject } from "../../hooks/useProjectService";
// import { ProjectStatus } from "../../types";
// import { toast } from "sonner";

// import { useNavigate } from "react-router-dom";
// import { useContext } from "react";
// import { ProjectContext } from "../../context/ProjectContext";


// export default function CreateProjectDialog({
//   isOpen,
//   onOpenChange,
//   workspaceId,
//   workspaceMembers,
// }) {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     reset,
//     setValue,
//     watch,
//   } = useForm({
//     resolver: projectSchema ? zodResolver(projectSchema) : undefined,
//     defaultValues: {
//       title: "",
//       description: "",
//       status: "Planning",
//       startDate: "",
//       dueDate: "",
//       members: [],
//       tags: "",
//     },
//   });

//   const navigate = useNavigate();

//     const { mutateAsync = async () => {}, isPending = false } =
//     (typeof UseCreateProject === "function" && UseCreateProject()) || {};

//  const sortByCreatedDesc = (a, b) =>
//     new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime();


//   // lock body scroll
//   useEffect(() => {
//     document.body.style.overflow = isOpen ? "hidden" : "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [isOpen]);

//   // reset when opened
//   useEffect(() => {
//     if (isOpen) {
//       reset({
//         title: "",
//         description: "",
//         status: "Planning",
//         startDate: "",
//         dueDate: "",
//         members: [],
//         tags: "",
//       });
//     }
//   }, [isOpen, reset]);

//   // form fields
//   const startDate = watch("startDate");
//   const dueDate = watch("dueDate");
//   const statusValue = watch("status");
//   const membersValue = watch("members") || [];

//   const setMembers = (next) =>
//     setValue("members", next, { shouldValidate: true, shouldDirty: true });

//   // date helpers
//   const handleNativeDateChange = (name) => (e) => {
//     const v = e.target.value;
//     if (v) {
//       const iso = new Date(v + "T00:00:00").toISOString();
//       setValue(name, iso, { shouldValidate: true, shouldDirty: true });
//     } else {
//       setValue(name, "", { shouldValidate: true, shouldDirty: true });
//     }
//   };
//   const isoToDateInput = (iso) => {
//     if (!iso) return "";
//     try {
//       const d = new Date(iso);
//       const yyyy = d.getFullYear();
//       const mm = String(d.getMonth() + 1).padStart(2, "0");
//       const dd = String(d.getDate()).padStart(2, "0");
//       return `${yyyy}-${mm}-${dd}`;
//     } catch {
//       return "";
//     }
//   };

//   // status options (labels)
//   const statusOptions = useMemo(() => {
//     if (ProjectStatus && typeof ProjectStatus === "object") {
//       const vals = Object.values(ProjectStatus);
//       // StatusSelect apne aap normalize karega; yahan labels pass kar den
//       return vals;
//     }
//     return ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
//   }, []);

// //    const { refetchProjects, setCurrentProject, setProjects } = useContext(ProjectContext) ;
//     const projectCtx = useContext(ProjectContext) ?? {};
//     const {
//         refetchProjects = () => {},
//         setCurrentProject = () => {},
//         setProjects = () => {},
//     } = projectCtx;

//   const onSubmit = async (values) => {
//     if (!workspaceId) return;

//     // workspace-style normalization (tags string -> string[])
//     const payload = {
//         ...values,
//         tags: Array.isArray(values.tags)
//             ? values.tags.join(",")
//             : (values.tags ?? ""),
//         };

//     try {
//       // 🟢 IMPORTANT: hook ko Workspace-style payload do:
//       // mutateAsync({ workspaceId, ...projectFields })
//       // Hook URL me workspaceId use karega aur body me sirf project fields bhejega.
//       const created = await mutateAsync({ workspaceId, ...payload });

//       // (Optional) agar aap ProjectContext rakhte ho to yahan local list update kar sakte ho:
//     //   setProjects?.((prev = []) => [...prev, created].sort(sortByCreatedDesc));
//     setProjects?.((prev) => [...(Array.isArray(prev) ? prev : []), created].sort(sortByCreatedDesc));
//       setCurrentProject?.(created);

//       // Workspace create ke baad aap dashboard pe jaate ho — same here:
//       // navigate(`/projects/${created?._id}`); // ya detail pe bhejna ho to
//     //   console.log("Created Project:", created);
//     //   console.log("Workspace ID:", workspaceId);
//     //   navigate(`/workspaces/${workspaceId}`);

//     //   toast?.success?.("Project created successfully");
//     //   reset();
//     //   onOpenChange?.(false);

//         toast?.success?.("Project created successfully");
//         // CHANGED: pehle modal close + reset (overlay/scroll-lock se black screen avoid)
//         onOpenChange?.(false);         // CHANGED
//         reset();                       // CHANGED
//         // CHANGED: ProjectProvider ka data fresh karao before navigate
//         await Promise.resolve(refetchProjects()); // CHANGED
//         // CHANGED: end me navigate
//         navigate(`/workspaces/${workspaceId}`, { replace: true }); // CHANGED

//     } catch (error) {
//       const msg = error?.response?.data?.message || "Something went wrong";
//       toast?.error?.(msg);
//       console.log(error);
//     }
//   };

//   return (
//     <ModalShell
//       isOpen={isOpen}
//       onClose={() => onOpenChange?.(false)}
//       title="Create Project"
//       footer={
//         <>
//           {/* <Button type="button" onClick={() => onOpenChange?.(false)} variant="secondary">
//             Cancel
//           </Button> */}
//           <Button type="submit" form="create-project-form" isLoading={isSubmitting || isPending}>
//             Create Project
//           </Button>
//         </>
//       }
//     >
//       <form id="create-project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <InputField
//           label="Project Title"
//           name="title"
//           type="text"
//           register={register}
//           errors={errors}
//           placeholder="Project Title"
//           required
//         />

//         <TextareaInputField
//           label="Project Description"
//           name="description"
//           register={register}
//           errors={errors}
//           placeholder="Write project description"
//           rows={3}
//         />

//         {/* Project Status */}
//         <div className="space-y-2">
//           <label className="block text-sm font-medium text-gray-900 dark:text-white">
//             Project Status
//           </label>
//           <StatusSelect
//             value={statusValue}
//             options={statusOptions}
//             onChange={(v) => setValue("status", v, { shouldValidate: true, shouldDirty: true })}
//           />
//           {errors?.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
//         </div>

//         {/* Dates */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-900 dark:text-white">
//               Start Date
//             </label>
//             <input
//               type="date"
//               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
//                          focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
//                          block w-full p-2.5
//                          dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
//                          dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500"
//               value={isoToDateInput(startDate)}
//               onChange={handleNativeDateChange("startDate")}
//             />
//             {errors?.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
//           </div>

//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-900 dark:text-white">
//               Due Date
//             </label>
//             <input
//               type="date"
//               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
//                          focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
//                          block w-full p-2.5
//                          dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
//                          dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500"
//               value={isoToDateInput(dueDate)}
//               onChange={handleNativeDateChange("dueDate")}
//             />
//             {errors?.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>}
//           </div>
//         </div>

//         {/* Tags */}
//         <InputField
//           label="Tags"
//           name="tags"
//           type="text"
//           register={register}
//           errors={errors}
//           placeholder="comma,separated,tags"
//         />

//         {/* Members */}
//         <TeamMembersDropdown
//           workspaceMembers={workspaceMembers || []}
//           value={membersValue}
//           onChange={setMembers}
//           label="Members"
//           placeholder="Select Members"
//         />
//       </form>
//     </ModalShell>
//   );
// }


































// // create-project.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {Button} from "../form/Button";
// import {InputField} from "../form/InputField";
// import {TextareaInputField} from "../form/TextareaInputField";
// import TeamMembersDropdown from "../form/dropdown/TeamMembersDropdown";
// import { FiChevronDown } from "react-icons/fi";
// import { MdCheck } from "react-icons/md";

// // OPTIONAL (adjust/remove if paths differ in your app)
// import { projectSchema } from "../../lib/schema";
// import { UseCreateProject } from "../../hooks/useProjectService";
// import { ProjectStatus } from "../../types";
// import { toast } from "sonner";

// /* -------------------- helpers -------------------- */
// const toTitle = (s = "") =>
//   s
//     .toString()
//     .replace(/_/g, " ")
//     .trim()
//     .toLowerCase()
//     .replace(/\b\w/g, (m) => m.toUpperCase());

// const toCode = (s = "") =>
//   s.toString().trim().replace(/\s+/g, "_").toUpperCase();

// /** Normalize incoming options (strings or objects) to:
//  *  [{ id: 'PLANNING', label: 'Planning' }, ...] and de-dup by id
//  */
// const normalizeStatusOptions = (options) => {
//   const arr = Array.isArray(options) ? options : [];
//   const mapped = arr
//     .map((o) => {
//       if (o && typeof o === "object") {
//         const rawId = o.id ?? o.value ?? o.code ?? o.name ?? "";
//         const rawLabel = o.label ?? o.value ?? o.name ?? "";
//         const id = toCode(String(rawId || rawLabel));
//         const label =
//           rawLabel && /[a-z ]/.test(String(rawLabel))
//             ? String(rawLabel)
//             : toTitle(String(rawId || rawLabel));
//         return id ? { id, label } : null;
//       }
//       const str = String(o);
//       const looksLikeLabel = /[a-z ]/.test(str);
//       return { id: toCode(str), label: looksLikeLabel ? str : toTitle(str) };
//     })
//     .filter(Boolean);

//   const map = new Map();
//   for (const it of mapped) if (!map.has(it.id)) map.set(it.id, it);
//   return Array.from(map.values());
// };

// /* -------------------- StatusSelect (returns LABEL) -------------------- */
// const StatusSelect = ({ value, onChange, options = [] }) => {
//   const [open, setOpen] = useState(false);
//   const [q, setQ] = useState("");
//   const rootRef = useRef(null);
//   const triggerRef = useRef(null);
//   const searchRef = useRef(null);
//   const [panelW, setPanelW] = useState(0);

//   const items = useMemo(() => normalizeStatusOptions(options), [options]);
//   const current =
//     items.find((i) => i.label === value) || // value is label
//     items.find((i) => i.id === value) || // (just in case) if value accidentally is code
//     null;

//   // match width
//   useEffect(() => {
//     const measure = () => triggerRef.current && setPanelW(triggerRef.current.offsetWidth);
//     measure();
//     const ro = new ResizeObserver(measure);
//     if (triggerRef.current) ro.observe(triggerRef.current);
//     window.addEventListener("resize", measure);
//     return () => {
//       ro.disconnect?.();
//       window.removeEventListener("resize", measure);
//     };
//   }, []);

//   // outside + esc
//   useEffect(() => {
//     const onDoc = (e) => {
//       if (!rootRef.current) return;
//       if (!rootRef.current.contains(e.target)) setOpen(false);
//     };
//     const onEsc = (e) => e.key === "Escape" && setOpen(false);
//     document.addEventListener("mousedown", onDoc);
//     document.addEventListener("keydown", onEsc);
//     return () => {
//       document.removeEventListener("mousedown", onDoc);
//       document.removeEventListener("keydown", onEsc);
//     };
//   }, []);

//   useEffect(() => {
//     if (!open) return;
//     const t = setTimeout(() => searchRef.current?.focus(), 10);
//     return () => clearTimeout(t);
//   }, [open]);

//   const filtered = useMemo(() => {
//     const term = q.trim().toLowerCase();
//     if (!term) return items;
//     return items.filter((i) => i.label.toLowerCase().includes(term));
//   }, [items, q]);

//   // display ≥3 items then scroll
//   const ROW_H = 40;
//   const minRows = Math.min(3, Math.max(1, filtered.length || items.length || 3));
//   const listMin = ROW_H * minRows;
//   const listMax = Math.max(listMin, Math.min(6 * ROW_H, window.innerHeight * 0.5));

//   return (
//     <div ref={rootRef} className="w-full relative">
//       <button
//         ref={triggerRef}
//         type="button"
//         onClick={() => setOpen((v) => !v)}
//         className={`w-full min-h-11 px-4 py-2.5 text-left rounded-lg border
//           bg-gray-50 border-gray-300 text-gray-900
//           focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
//           dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-green-500
//           flex items-center justify-between`}
//       >
//         <span className={!current ? "text-gray-500" : ""}>
//           {current ? current.label : "Select Project Status"}
//         </span>
//         <FiChevronDown
//           className={`h-5 w-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
//         />
//       </button>

//       {open && (
//         <div className="absolute left-0 top-full z-50 mt-2" style={{ width: panelW }}>
//           <div className="rounded-xl border shadow-xl ring-1 ring-black/5
//                           bg-white text-gray-900 border-gray-200
//                           dark:bg-gray-800 dark:text-white dark:border-gray-700 overflow-hidden">
//             {/* search */}
//             <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0">
//               <input
//                 ref={searchRef}
//                 value={q}
//                 onChange={(e) => setQ(e.target.value)}
//                 placeholder="Search status…"
//                 className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-2
//                            focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
//               />
//             </div>

//             {/* list */}
//             <ul className="p-1 overflow-y-auto" style={{ minHeight: listMin, maxHeight: listMax }}>
//               {filtered.length === 0 && (
//                 <li className="px-3 py-2 text-sm opacity-70">No results</li>
//               )}
//               {filtered.map((opt) => {
//                 const active = (current?.id ?? "") === opt.id;
//                 return (
//                   <li key={opt.id}>
//                     <button
//                       type="button"
//                       onClick={() => {
//                         onChange(opt.label); // <-- RETURN LABEL (schema expects this)
//                         setOpen(false);
//                         triggerRef.current?.focus();
//                       }}
//                       className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md
//                                  hover:bg-gray-100 dark:hover:bg-gray-700"
//                     >
//                       <span className={active ? "font-medium" : ""}>{opt.label}</span>
//                       {active && <MdCheck className="h-4 w-4 opacity-90" />}
//                     </button>
//                   </li>
//                 );
//               })}
//             </ul>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// /* ===================== Create Project Dialog ===================== */
// export const CreateProjectDialog = ({
//   isOpen,
//   onOpenChange,
//   workspaceId,
//   workspaceMembers,
// }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     reset,
//     setValue,
//     watch,
//   } = useForm({
//     resolver: projectSchema ? zodResolver(projectSchema) : undefined,
//     defaultValues: {
//       title: "",
//       description: "",
//       status: "Planning", // <-- label, not code
//       startDate: "",
//       dueDate: "",
//       members: [],
//       tags: "",
//     },
//   });

//   const { mutate = () => {}, isPending = false } =
//     (typeof UseCreateProject === "function" && UseCreateProject()) || {};

//   useEffect(() => {
//     if (isOpen) document.body.style.overflow = "hidden";
//     else document.body.style.overflow = "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [isOpen]);

//   useEffect(() => {
//     if (isOpen) {
//       reset({
//         title: "",
//         description: "",
//         status: "Planning", // reset to label
//         startDate: "",
//         dueDate: "",
//         members: [],
//         tags: "",
//       });
//     }
//   }, [isOpen, reset]);

//   const startDate = watch("startDate");
//   const dueDate = watch("dueDate");
//   const statusValue = watch("status");
//   const membersValue = watch("members") || [];

//   const setMembers = (next) =>
//     setValue("members", next, { shouldValidate: true, shouldDirty: true });

//   const handleNativeDateChange = (name) => (e) => {
//     const v = e.target.value; // yyyy-MM-dd
//     if (v) {
//       const iso = new Date(v + "T00:00:00").toISOString();
//       setValue(name, iso, { shouldValidate: true, shouldDirty: true });
//     } else {
//       setValue(name, "", { shouldValidate: true, shouldDirty: true });
//     }
//   };
//   const isoToDateInput = (iso) => {
//     if (!iso) return "";
//     try {
//       const d = new Date(iso);
//       const yyyy = d.getFullYear();
//       const mm = String(d.getMonth() + 1).padStart(2, "0");
//       const dd = String(d.getDate()).padStart(2, "0");
//       return `${yyyy}-${mm}-${dd}`;
//     } catch {
//       return "";
//     }
//   };

//   // Build status options from enum or fallback list
//   const statusOptions = useMemo(() => {
//     if (ProjectStatus && typeof ProjectStatus === "object") {
//       const vals = Object.values(ProjectStatus);
//       return normalizeStatusOptions(vals).map((o) => o.label);
//     }
//     return ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
//   }, []);

//   const onSubmit = (values) => {
//     if (!workspaceId) return;

//     const payload = {
//       ...values,
//       ...(typeof values.tags === "string"
//         ? {
//             tags: values.tags
//               .split(",")
//               .map((t) => t.trim())
//               .filter(Boolean),
//           }
//         : {}),
//     };

//     mutate(
//       { projectData: payload, workspaceId },
//       {
//         onSuccess: () => {
//           toast?.success?.("Project created successfully");
//           reset();
//           onOpenChange?.(false);
//         },
//         onError: (error) => {
//           const errorMessage = error?.response?.data?.message || "Something went wrong";
//           toast?.error?.(errorMessage);
//           console.log(error);
//         },
//       }
//     );
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
//       <div
//         className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/50"
//         onClick={() => onOpenChange?.(false)}
//       />
//       <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] bg-white rounded-lg shadow-xl dark:bg-gray-800 overflow-y-auto">
//         <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
//           <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create Project</h3>
//           <button
//             type="button"
//             className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
//             onClick={() => onOpenChange?.(false)}
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
//           <InputField
//             label="Project Title"
//             name="title"
//             type="text"
//             register={register}
//             errors={errors}
//             placeholder="Project Title"
//             required
//           />

//           <TextareaInputField
//             label="Project Description"
//             name="description"
//             register={register}
//             errors={errors}
//             placeholder="Write project description"
//             rows={3}
//           />

//           {/* Project Status */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-900 dark:text-white">
//               Project Status
//             </label>
//             <StatusSelect
//               value={statusValue}             // label value
//               options={statusOptions}         // strings are fine; component normalizes
//               onChange={(v) =>
//                 setValue("status", v, { shouldValidate: true, shouldDirty: true })
//               }
//             />
//             {errors?.status && (
//               <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
//             )}
//           </div>

//           {/* Dates */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <label className="block text-sm font-medium text-gray-900 dark:text-white">
//                 Start Date
//               </label>
//               <input
//                 type="date"
//                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
//                            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
//                            block w-full p-2.5
//                            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
//                            dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500"
//                 value={isoToDateInput(startDate)}
//                 onChange={handleNativeDateChange("startDate")}
//               />
//               {errors?.startDate && (
//                 <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <label className="block text-sm font-medium text-gray-900 dark:text-white">
//                 Due Date
//               </label>
//               <input
//                 type="date"
//                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
//                            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
//                            block w-full p-2.5
//                            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
//                            dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500"
//                 value={isoToDateInput(dueDate)}
//                 onChange={handleNativeDateChange("dueDate")}
//               />
//               {errors?.dueDate && (
//                 <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
//               )}
//             </div>
//           </div>

//           {/* Tags */}
//           <InputField
//             label="Tags"
//             name="tags"
//             type="text"
//             register={register}
//             errors={errors}
//             placeholder="comma,separated,tags"
//           />

//           {/* Members */}
//           <TeamMembersDropdown
//             workspaceMembers={workspaceMembers || []}
//             value={membersValue}
//             onChange={setMembers}
//             label="Members"
//             placeholder="Select Members"
//           />

//           {/* Actions */}
//           <div className="sticky bottom-0 z-10 flex justify-end pt-4 pb-2 bg-white dark:bg-gray-800">
//             <Button type="submit" isLoading={isSubmitting || isPending}>
//               Create Project
//             </Button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CreateProjectDialog;




























// import { useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// // ✅ Your simple form components
// import { InputField } from "../form/InputField";
// import { TextareaInputField } from "../form/TextareaInputField";
// import { Button } from "../form/Button";

// // ✅ Our dropdown (now workspaceMembers-based, no API hook)
// import TeamMembersDropdown from "../form/dropdown/TeamMembersDropdown";

// // ✅ Schema / enums / service
// import { projectSchema } from "../../lib/schema";
// import { ProjectStatus } from "../../types";
// import { UseCreateProject } from "../../hooks/useProjectService";
// import { toast } from "sonner";

// export const CreateProjectDialog = ({
//   isOpen,
//   onOpenChange,
//   workspaceId,
//   workspaceMembers, // [{ _id, user: { _id, name }, role }]
// }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     reset,
//     setValue,
//     watch,
//   } = useForm({
//     resolver: zodResolver(projectSchema),
//     defaultValues: {
//       title: "",
//       description: "",
//       status: ProjectStatus?.PLANNING ?? "PLANNING",
//       startDate: "",
//       dueDate: "",
//       members: [], // [{ user, role }]
//       tags: "",
//     },
//   });

//   const { mutate, isPending } = UseCreateProject();

//   // Lock scroll when modal open
//   useEffect(() => {
//     if (isOpen) document.body.style.overflow = "hidden";
//     else document.body.style.overflow = "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [isOpen]);

//   // Reset on open
//   useEffect(() => {
//     if (isOpen) {
//       reset({
//         title: "",
//         description: "",
//         status: ProjectStatus?.PLANNING ?? "PLANNING",
//         startDate: "",
//         dueDate: "",
//         members: [],
//         tags: "",
//       });
//     }
//   }, [isOpen, reset]);

//   // Dates -> ISO strings for schema
//   const startDate = watch("startDate");
//   const dueDate = watch("dueDate");

//   const handleNativeDateChange = (name) => (e) => {
//     const v = e.target.value; // yyyy-MM-dd
//     if (v) {
//       const iso = new Date(v + "T00:00:00").toISOString();
//       setValue(name, iso, { shouldValidate: true });
//     } else {
//       setValue(name, "", { shouldValidate: true });
//     }
//   };

//   // Members controlled field
//   const membersValue = watch("members") || [];
//   const setMembers = (next) => {
//     // Expect shape: [{ user, role }]
//     setValue("members", next, { shouldValidate: true });
//   };

//   const onSubmit = (values) => {
//     if (!workspaceId) return;

//     mutate(
//       {
//         projectData: {
//           ...values,
//           // if tags is string -> array
//           ...(typeof values.tags === "string"
//             ? {
//                 tags: values.tags
//                   .split(",")
//                   .map((t) => t.trim())
//                   .filter(Boolean),
//               }
//             : {}),
//         },
//         workspaceId,
//       },
//       {
//         onSuccess: () => {
//           toast.success("Project created successfully");
//           reset();
//           onOpenChange(false);
//         },
//         onError: (error) => {
//           const errorMessage =
//             error?.response?.data?.message || "Something went wrong";
//           toast.error(errorMessage);
//           console.log(error);
//         },
//       }
//     );
//   };

//   if (!isOpen) return null;

//   // ISO -> yyyy-MM-dd for display
//   const isoToDateInput = (iso) => {
//     if (!iso) return "";
//     try {
//       const d = new Date(iso);
//       const yyyy = d.getFullYear();
//       const mm = String(d.getMonth() + 1).padStart(2, "0");
//       const dd = String(d.getDate()).padStart(2, "0");
//       return `${yyyy}-${mm}-${dd}`;
//     } catch {
//       return "";
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
//       {/* Overlay */}
//       <div
//         className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/50"
//         onClick={() => onOpenChange(false)}
//       />

//       {/* Modal */}
//       <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] bg-white rounded-lg shadow-xl dark:bg-gray-800 overflow-y-auto">
//         {/* Header */}
//         <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
//           <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
//             Create Project
//           </h3>
//           <button
//             type="button"
//             className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
//             onClick={() => onOpenChange(false)}
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         {/* Body */}
//         <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
//           <InputField
//             label="Project Title"
//             name="title"
//             type="text"
//             register={register}
//             errors={errors}
//             placeholder="Project Title"
//             required
//           />

//           <TextareaInputField
//             label="Project Description"
//             name="description"
//             register={register}
//             errors={errors}
//             placeholder="Write project description"
//             rows={3}
//           />

//           {/* Status */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-900 dark:text-white">
//               Project Status
//             </label>
//             <select
//               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
//                          focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
//                          block w-full p-2.5
//                          dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
//                          dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500"
//               {...register("status")}
//               defaultValue={ProjectStatus?.PLANNING ?? "PLANNING"}
//             >
//               {Object.values(ProjectStatus || { PLANNING: "PLANNING" }).map((s) => (
//                 <option key={s} value={s}>
//                   {s}
//                 </option>
//               ))}
//             </select>
//             {errors.status && (
//               <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
//             )}
//           </div>

//           {/* Dates */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <label className="block text-sm font-medium text-gray-900 dark:text-white">
//                 Start Date
//               </label>
//               <input
//                 type="date"
//                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
//                            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
//                            block w-full p-2.5
//                            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
//                            dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500"
//                 value={isoToDateInput(startDate)}
//                 onChange={handleNativeDateChange("startDate")}
//               />
//               {errors.startDate && (
//                 <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <label className="block text-sm font-medium text-gray-900 dark:text-white">
//                 Due Date
//               </label>
//               <input
//                 type="date"
//                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
//                            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
//                            block w-full p-2.5
//                            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
//                            dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500"
//                 value={isoToDateInput(dueDate)}
//                 onChange={handleNativeDateChange("dueDate")}
//               />
//               {errors.dueDate && (
//                 <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
//               )}
//             </div>
//           </div>

//           {/* Tags */}
//           <InputField
//             label="Tags"
//             name="tags"
//             type="text"
//             register={register}
//             errors={errors}
//             placeholder="comma,separated,tags"
//           />

//           {/* Members (checkbox + role select, workspaceMembers-based) */}
//           <TeamMembersDropdown
//             workspaceMembers={workspaceMembers || []}
//             value={membersValue}
//             onChange={setMembers}
//             label="Members"
//             placeholder="Select Members"
//           />

//           {/* Footer actions */}
//           <div className="sticky bottom-0 z-10 flex justify-end pt-4 pb-2 bg-white dark:bg-gray-800">
//             <Button type="submit" isLoading={isSubmitting || isPending}>
//               Create Project
//             </Button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };





























// import { projectSchema } from "../../lib/schema";
// import { ProjectStatus } from "../../types/index.js";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "../ui/dialog";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "../ui/form";
// import { Input } from "../ui/input";
// import { Textarea } from "../ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";
// import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
// import { Button } from "../ui/button";

// import { format } from "date-fns";
// import { CalendarIcon } from "lucide-react";
// import { Calendar } from "../ui/calendar";
// import { Checkbox } from "../ui/checkbox";
// import { UseCreateProject } from "@/hooks/use-project";
// import { toast } from "sonner";

// export const CreateProjectDialog = ({
//   isOpen,
//   onOpenChange,
//   workspaceId,
//   workspaceMembers,
// }) => {
//   const form = useForm({
//     resolver: zodResolver(projectSchema),
//     defaultValues: {
//       title: "",
//       description: "",
//       status: ProjectStatus.PLANNING,
//       startDate: "",
//       dueDate: "",
//       members: [],
//       tags: undefined,
//     },
//   });

//   const { mutate, isPending } = UseCreateProject();

//   const onSubmit = (values) => {
//     if (!workspaceId) return;

//     mutate(
//       {
//         projectData: values,
//         workspaceId,
//       },
//       {
//         onSuccess: () => {
//           toast.success("Project created successfully");
//           form.reset();
//           onOpenChange(false);
//         },
//         onError: (error) => {
//           const errorMessage = error.response?.data?.message || "Something went wrong";
//           toast.error(errorMessage);
//           console.log(error);
//         },
//       }
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[540px]">
//         <DialogHeader>
//           <DialogTitle>Create Project</DialogTitle>
//           <DialogDescription>
//             Create a new project to get started
//           </DialogDescription>
//         </DialogHeader>

//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//             {/* Project Title */}
//             <FormField
//               control={form.control}
//               name="title"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Project Title</FormLabel>
//                   <FormControl>
//                     <Input {...field} placeholder="Project Title" />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Project Description */}
//             <FormField
//               control={form.control}
//               name="description"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Project Description</FormLabel>
//                   <FormControl>
//                     <Textarea
//                       {...field}
//                       placeholder="Project Description"
//                       rows={3}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Project Status */}
//             <FormField
//               control={form.control}
//               name="status"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Project Status</FormLabel>
//                   <FormControl>
//                     <Select value={field.value} onValueChange={field.onChange}>
//                       <SelectTrigger className="w-full">
//                         <SelectValue placeholder="Select Project Status" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {Object.values(ProjectStatus).map((status) => (
//                           <SelectItem key={status} value={status}>
//                             {status}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Dates */}
//             <div className="grid grid-cols-2 gap-4">
//               {/* Start Date */}
//               <FormField
//                 control={form.control}
//                 name="startDate"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Start Date</FormLabel>
//                     <FormControl>
//                       <Popover modal={true}>
//                         <PopoverTrigger asChild>
//                           <Button
//                             variant={"outline"}
//                             className={
//                               "w-full justify-start text-left font-normal" +
//                               (!field.value ? "text-muted-foreground" : "")
//                             }
//                           >
//                             <CalendarIcon className="size-4 mr-2" />
//                             {field.value ? (
//                               format(new Date(field.value), "PPPP")
//                             ) : (
//                               <span>Pick a date</span>
//                             )}
//                           </Button>
//                         </PopoverTrigger>
//                         <PopoverContent>
//                           <Calendar
//                             mode="single"
//                             selected={field.value ? new Date(field.value) : undefined}
//                             onSelect={(date) => {
//                               field.onChange(date?.toISOString() || undefined);
//                             }}
//                           />
//                         </PopoverContent>
//                       </Popover>
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Due Date */}
//               <FormField
//                 control={form.control}
//                 name="dueDate"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Due Date</FormLabel>
//                     <FormControl>
//                       <Popover modal={true}>
//                         <PopoverTrigger asChild>
//                           <Button
//                             variant={"outline"}
//                             className={
//                               "w-full justify-start text-left font-normal" +
//                               (!field.value ? "text-muted-foreground" : "")
//                             }
//                           >
//                             <CalendarIcon className="size-4 mr-2" />
//                             {field.value ? (
//                               format(new Date(field.value), "PPPP")
//                             ) : (
//                               <span>Pick a date</span>
//                             )}
//                           </Button>
//                         </PopoverTrigger>
//                         <PopoverContent>
//                           <Calendar
//                             mode="single"
//                             selected={field.value ? new Date(field.value) : undefined}
//                             onSelect={(date) => {
//                               field.onChange(date?.toISOString() || undefined);
//                             }}
//                           />
//                         </PopoverContent>
//                       </Popover>
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             {/* Tags */}
//             <FormField
//               control={form.control}
//               name="tags"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Tags</FormLabel>
//                   <FormControl>
//                     <Input {...field} placeholder="Tags separated by comma" />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Members */}
//             <FormField
//               control={form.control}
//               name="members"
//               render={({ field }) => {
//                 const selectedMembers = field.value || [];

//                 return (
//                   <FormItem>
//                     <FormLabel>Members</FormLabel>
//                     <FormControl>
//                       <Popover>
//                         <PopoverTrigger asChild>
//                           <Button
//                             variant={"outline"}
//                             className="w-full justify-start text-left font-normal min-h-11"
//                           >
//                             {selectedMembers.length === 0 ? (
//                               <span className="text-muted-foreground">
//                                 Select Members
//                               </span>
//                             ) : selectedMembers.length <= 2 ? (
//                               selectedMembers.map((m) => {
//                                 const member = workspaceMembers.find(
//                                   (wm) => wm.user._id === m.user
//                                 );
//                                 return `${member?.user.name} (${member?.role})`;
//                               })
//                             ) : (
//                               `${selectedMembers.length} members selected`
//                             )}
//                           </Button>
//                         </PopoverTrigger>
//                         <PopoverContent
//                           className="w-full max-w-60 overflow-y-auto"
//                           align="start"
//                         >
//                           <div className="flex flex-col gap-2">
//                             {workspaceMembers.map((member) => {
//                               const selectedMember = selectedMembers.find(
//                                 (m) => m.user === member.user._id
//                               );

//                               return (
//                                 <div
//                                   key={member._id}
//                                   className="flex items-center gap-2 p-2 border rounded"
//                                 >
//                                   <Checkbox
//                                     checked={!!selectedMember}
//                                     onCheckedChange={(checked) => {
//                                       if (checked) {
//                                         field.onChange([
//                                           ...selectedMembers,
//                                           {
//                                             user: member.user._id,
//                                             role: "contributor",
//                                           },
//                                         ]);
//                                       } else {
//                                         field.onChange(
//                                           selectedMembers.filter(
//                                             (m) => m.user !== member.user._id
//                                           )
//                                         );
//                                       }
//                                     }}
//                                     id={`member-${member.user._id}`}
//                                   />
//                                   <span className="truncate flex-1">
//                                     {member.user.name}
//                                   </span>

//                                   {selectedMember && (
//                                     <Select
//                                       value={selectedMember.role}
//                                       onValueChange={(role) => {
//                                         field.onChange(
//                                           selectedMembers.map((m) =>
//                                             m.user === member.user._id
//                                               ? { ...m, role }
//                                               : m
//                                           )
//                                         );
//                                       }}
//                                     >
//                                       <SelectTrigger>
//                                         <SelectValue placeholder="Select Role" />
//                                       </SelectTrigger>
//                                       <SelectContent>
//                                         <SelectItem value="manager">
//                                           Manager
//                                         </SelectItem>
//                                         <SelectItem value="contributor">
//                                           Contributor
//                                         </SelectItem>
//                                         <SelectItem value="viewer">
//                                           Viewer
//                                         </SelectItem>
//                                       </SelectContent>
//                                     </Select>
//                                   )}
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         </PopoverContent>
//                       </Popover>
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 );
//               }}
//             />

//             <DialogFooter>
//               <Button type="submit" disabled={isPending}>
//                 {isPending ? "Creating..." : "Create Project"}
//               </Button>
//             </DialogFooter>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   );
// };
