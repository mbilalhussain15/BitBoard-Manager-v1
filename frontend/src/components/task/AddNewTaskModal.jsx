import React, { useState, useEffect } from "react";
import ModalShell from "../form/ModalShell";
import { useAuth } from "../../provider/auth-context";
import { Sparkles } from "lucide-react";
import AddNewTaskManual from "./tabs/AddNewTaskManual";
import CreateTaskAIPlanner from "./tabs/CreateTaskAIPlanner";

export default function AddNewTaskModal({
  open,
  onClose,
  mode = "create",
  taskId,
  boardId,
  defaultStatus,
  currentBoard,
  workspaceId,
  projectId,
  refetch,
}) {
  const [footerNode, setFooterNode] = useState(null);
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("manual");
  useEffect(() => setFooterNode(null), [activeTab, mode]);

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
      isOpen={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit task" : "Create task"}
      footer={footerNode}
    >
      <div className="space-y-4">
        {showTabs && (
          <div role="tablist" className="grid grid-cols-2 gap-3 w-full">
            <Tab id="manual" label="Manual" />
            <Tab
              id="ai"
              label={
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={14} />
                  AI Task Agent
                </span>
              }
            />
          </div>
        )}

        <div className="w-full transition-[min-height] duration-200 ease-out min-h-[520px]">
          {showTabs && activeTab === "ai" ? (
            <CreateTaskAIPlanner 
              key="ai"
              setFooter={setFooterNode}
              workspaceId={workspaceId}
              projectId={projectId}
              boardId={boardId}
              user={user}
              refetch={refetch}
              onClose={onClose}
              
              />
          ) : (
            <AddNewTaskManual
              key="manual"
              mode={mode}
              taskId={taskId}
              boardId={boardId}
              defaultStatus={defaultStatus}
              currentBoard={currentBoard}
              workspaceId={workspaceId}
              projectId={projectId}
              refetch={refetch}
              setFooter={setFooterNode}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </ModalShell>
  );
}



























// // src/components/task/AddNewTaskModal.jsx
// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import { UseCreateTask, UseUpdateTask, UseGetTaskById } from "../../hooks/useTaskService";
// import { useBulkUploadTaskFiles, useUpdateTaskFiles, useDeleteTaskFile } from "../../hooks/useTaskFileService";
// import FileUploader from "./FileUploader";
// import MemberPicker from "../task/dropdown/MemberPicker";
// import StatusDropdown from "../task/dropdown/StatusDropdown";
// import PriorityDropdown from "../task/dropdown/PriorityDropdown";
// import QuillEditor from "../form/QuillEditor/QuillEditor";
// import { useForm, Controller } from "react-hook-form"; 
// import { InputField } from "../form/InputField";
// import { Sparkles, Loader2 } from "lucide-react"; // CHANGED: icon + loader
// import { toast } from "sonner";                  // CHANGED: feedback
// import { UseAutoDescribeTask, UseImproveTask } from "../../hooks/useAiPlannerService"; // CHANGED: reuse same API helper if present

// // mode: "create" | "edit"
// // taskId: required when mode === "edit"
// export default function AddNewTaskModal({
//   open,
//   onClose,
//   mode = "create",
//   taskId,
//   boardId,
//   defaultStatus,
//   currentBoard,
//   workspaceId,
//   projectId,
//   refetch
  

// }) {
//   const shellRef = useRef(null);
//   const editorRef = useRef(null);



//   const createTask = UseCreateTask();
//   const updateTask = UseUpdateTask();
//   const bulkUpload = useBulkUploadTaskFiles();
//   const updateTaskFiles = useUpdateTaskFiles();
//   const deleteTaskFile = useDeleteTaskFile();

//   // const { data: taskData, isFetching: isTaskLoading } = UseGetTaskById(mode === "edit" ? taskId : undefined);

//   const { data: taskData, isFetching: isTaskLoading } = UseGetTaskById(
//         mode === "edit" ? { taskId, projectId } : {}
//       );


//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [status, setStatus] = useState(defaultStatus || "Todo");
//   const [priority, setPriority] = useState("medium");
//   const [teamAssignee, setTeamAssignee] = useState(null);
//   const [teamReporter, setTeamReporter] = useState([]);
//   const [subtasks, setSubtasks] = useState([]);

//   // existing attachments come as hosted objects
//   // new local files carry .file
//   const [fileUrls, setFileUrls] = useState([]);
//   const [showError, setShowError] = useState(false);

//   const [aiThinking, setAiThinking] = useState(false); 
//   const { mutateAsync: autoDescribeAsync, isPending: isAutoDescribing } = UseAutoDescribeTask(); // CHANGED
//   const { mutateAsync: improveAsync, isPending: isImproving } = UseImproveTask();               // CHANGED

//   const aiBusy = aiThinking || isAutoDescribing || isImproving;


//   useEffect(() => {
//     if (defaultStatus && mode === "create") setStatus(defaultStatus);
//   }, [defaultStatus, mode]);

//   useEffect(() => {
//     document.body.style.overflow = open ? "hidden" : "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [open]);

//   // react-hook-form setup for description field
//   const { control, setValue, watch, getValues, reset } = useForm({
//     defaultValues: {
//       taskDescription: "",
//     },
//   });

//   // watch description and keep local state in sync so existing code works
//   useEffect(() => {
//     const sub = watch((value, { name }) => {
//       if (name === "taskDescription") setDescription(value?.taskDescription ?? "");
//     });
//     return () => sub.unsubscribe();
//   }, [watch]);



//   // prefill everything in edit mode without changing your UI
//   useEffect(() => {
//     if (mode !== "edit" || !taskData) return;

//     setTitle(taskData.taskName || "");
//     // setDescription(taskData.taskDescription ?? "");

//     const incoming = taskData.taskDescription ?? "";
//     setDescription(incoming);
//     setValue("taskDescription", incoming, { shouldDirty: false, keepValues: false  });  

//     setStatus(taskData.status || defaultStatus || "Todo");
//     setPriority(taskData.priorityLevel || "medium");
    

//     // assignee single
//     const assigneeId = Array.isArray(taskData.assignee) && taskData.assignee[0];
//     if (assigneeId) {
//       const found = (currentBoard?.members || [])
//         .map(m => m.user || m)
//         .find(u => String(u?._id) === String(assigneeId));
//       setTeamAssignee(
//         found
//           ? { _id: found._id, firstName: found.firstName, profileImage: found.profilePicture || found.profileImage }
//           : { _id: assigneeId }
//       );
//     } else {
//       setTeamAssignee(null);
//     }

//     // reporter single
//     const reporterId = Array.isArray(taskData.reporter) && taskData.reporter[0];
//     if (reporterId) {
//       const foundR = (currentBoard?.members || [])
//         .map(m => m.user || m)
//         .find(u => String(u?._id) === String(reporterId));
//       setTeamReporter(
//         foundR
//           ? [{ _id: foundR._id, firstName: foundR.firstName, profileImage: foundR.profilePicture || foundR.profileImage }]
//           : [{ _id: reporterId }]
//       );
//     } else {
//       setTeamReporter([]);
//     }

//     // subtasks
//     setSubtasks(
//       Array.isArray(taskData.subtasks)
//         ? taskData.subtasks.map(s => ({
//             subtaskName: s.subtaskName || "",
//             subTaskDescription: s.subTaskDescription || "",
//             isCompleted: !!s.isCompleted,
//           }))
//         : []
//     );

//     // existing attachments
//     const existing = Array.isArray(taskData.attachments)
//       ? taskData.attachments.map(a => ({
//           fileUrl: a.fileUrl,
//           fileName: a.fileName,
//           fileType: a.fileType,
//           fileSize: a.fileSize,
//           uploadedBy: a.uploadedBy,
//           uploadedAt: a.uploadedAt,
//         }))
//       : [];
//     setFileUrls(existing);
//   }, [mode, taskData, currentBoard, defaultStatus, setValue]);

  
//   // create mode reset
//   useEffect(() => {
//     if (mode === "create") {
//       reset({ taskDescription: "" });
//       setDescription("");
//     }
//   }, [mode, reset]);

//   // const editorKey = `${mode}-${taskId ?? "new"}-${String(taskData?.taskDescription ?? "").length}`;
//  const watchedDesc = watch("taskDescription") || "";  // NEW
//  const editorKey = `${mode}-${taskId ?? "new"}-${watchedDesc.length}`;




//   useEffect(() => {
//     const onOutside = e => {
//       if (!open) return;
//       if (shellRef.current && !shellRef.current.contains(e.target)) onClose?.();
//     };
//     const onEsc = e => e.key === "Escape" && onClose?.();
//     if (open) {
//       document.addEventListener("mousedown", onOutside);
//       window.addEventListener("keydown", onEsc);
//     }
//     return () => {
//       document.removeEventListener("mousedown", onOutside);
//       window.removeEventListener("keydown", onEsc);
//     };
//   }, [open, onClose]);

//   const busy =
//     createTask.isPending || updateTask.isPending || bulkUpload.isPending || updateTaskFiles.isPending || isTaskLoading;

//   const disabled = useMemo(() => {
//     const blocking = busy;
//     return !title || !status || !priority || !teamAssignee || !teamReporter.length || blocking;
//   }, [title, status, priority, teamAssignee, teamReporter, busy]);

//   const addSubtaskRow = () => setSubtasks(p => [...p, { subtaskName: "", subTaskDescription: "", isCompleted: false }]);
//   const updateSubtask = (i, k, v) => setSubtasks(p => p.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
//   const removeSubtask = i => setSubtasks(p => p.filter((_, idx) => idx !== i));

//   // dedupe helper for local File objects
//   const dedupeByNameSize = arr => {
//     const seen = new Set();
//     const out = [];
//     for (const f of arr) {
//       const n = f?.name || f?.fileName;
//       const s = f?.size || f?.fileSize || 0;
//       const key = `${n}-${s}`;
//       if (!seen.has(key)) {
//         seen.add(key);
//         out.push(f);
//       }
//     }
//     return out;
//   };


//   const handleAiDescribeOrImprove = useCallback(async () => {
//   const titleValue = (title || "").trim();
//   const descriptionValue = (getValues("taskDescription") || "").trim();
//   if (!titleValue) {
//     toast?.error?.("Please add a title first");
//     return;
//   }
//   try {
//     setAiThinking(true);

//     if (!descriptionValue) {
//       const res = await autoDescribeAsync({ title: titleValue }); // hits /task-agent/auto-describe
//       const ai =
//         res?.description ||
//         res?.data?.description ||
//         res?.result?.description ||
//         res?.text ||
//         res?.content ||
//         "";
//       if (!ai) {
//         toast?.error?.("AI did not return a description");
//         return;
//       }
//       setValue("taskDescription", ai, { shouldValidate: true, shouldDirty: true });
//       setDescription(ai);
//       toast?.success?.("Description generated");
//     } else {
//       const res = await improveAsync({ title: titleValue, description: descriptionValue }); // hits /task-agent/improve
//       const ai =
//         res?.description ||
//         res?.data?.description ||
//         res?.result?.description ||
//         res?.text ||
//         res?.content ||
//         "";
//       if (!ai) {
//         toast?.error?.("AI did not return an improved description");
//         return;
//       }
//       setValue("taskDescription", ai, { shouldValidate: true, shouldDirty: true });
//       setDescription(ai);
//       toast?.success?.("Description improved");
//     }
//   } catch (err) {
//     const msg = err?.response?.data?.message || err?.message || "Something went wrong";
//     toast?.error?.(msg);
//   } finally {
//     setAiThinking(false);
//   }
// }, [title, getValues, setValue, autoDescribeAsync, improveAsync]);



//   async function handleSubmit(e) {
//     e.preventDefault();

//     const currentDescription = getValues("taskDescription") ?? "";

//     if (!title || !status || !priority || !teamAssignee || !teamReporter.length) {
//       setShowError(true);
//       return;
//     }
//     setShowError(false);

//     if (mode === "create") {
//       // create task without attachments first
//       const payload = {
//         projectId,
//         boardId,
//         taskName: title,
//         // taskDescription: description,
//         taskDescription: currentDescription,
//         subtasks: (subtasks || []).map(s => ({
//           subtaskName: s.subtaskName || "",
//           subTaskDescription: s.subTaskDescription || "",
//           isCompleted: !!s.isCompleted,
//         })),
//         status,
//         assigneeIds: teamAssignee?._id ? [teamAssignee._id] : [],
//         reporterIds: teamReporter.map(u => u?._id).filter(Boolean),
//         priorityLevel: priority,
//         fileUrls: [],
//       };

//       const res = await createTask.mutateAsync(payload);
//       const newTaskId = res?.taskId;
//       if (!newTaskId) {
//         onClose?.();
//         setTimeout(() => refetch?.(), 0);
//         return;
//       }

//       // upload any local files
//       const localFiles = (fileUrls || [])
//         .map(f => f?.file || f)
//         .filter(x => x && x instanceof File);

//       if (localFiles.length) {
//         const fd = new FormData();
//         for (const f of dedupeByNameSize(localFiles)) {
//           fd.append("files", f);
//         }
//         const up = await bulkUpload.mutateAsync({
//           workspaceId,
//           projectId,
//           boardId,
//           taskId: newTaskId,
//           formData: fd,
//         });

//         const saved = up?.files || [];
//         // use backend provided fields so preview works
//         const hosted = saved.map(s => ({
//           fileUrl: s.fileUrl,
//           fileName: s.fileName,
//           fileType: s.fileType,
//           fileSize: s.fileSize,
//           isValidUrl: true,
//         }));

//         if (hosted.length) {
//           await updateTaskFiles.mutateAsync({
//             workspaceId,
//             projectId,
//             boardId,
//             taskId: newTaskId,
//             fileUrls: hosted,
//           });
//         }
//       }
//       refetch();
//     } else {
//       // edit mode
//       // split existing hosted vs newly added local files
//       const existingHosted = (fileUrls || [])
//         .filter(f => !f.file)
//         .map(f => ({
//           fileUrl: f.fileUrl,
//           fileName: f.fileName,
//           fileType: f.fileType,
//           fileSize: f.fileSize,
//           isValidUrl: true,
//         }));

//       const newLocal = (fileUrls || [])
//         .map(f => (f?.file ? f.file : null))
//         .filter(Boolean);

//       let hostedNew = [];
//       if (newLocal.length) {
//         const fd = new FormData();
//         for (const f of dedupeByNameSize(newLocal)) {
//           fd.append("files", f);
//         }
//         const up = await bulkUpload.mutateAsync({
//           workspaceId,
//           projectId,
//           boardId,
//           taskId,
//           formData: fd,
//         });
//         const saved = up?.files || [];
//         hostedNew = saved.map(s => ({
//           fileUrl: s.fileUrl,
//           fileName: s.fileName,
//           fileType: s.fileType,
//           fileSize: s.fileSize,
//           isValidUrl: true,
//         }));
//       }

//       const finalFiles = [...existingHosted, ...hostedNew];

//       // delete removed ones from disk compared to what was stored earlier
//       const keptNames = new Set(finalFiles.map(f => String(f.fileName)));
//       const removed = (taskData?.attachments || []).filter(f => !keptNames.has(String(f.fileName)));
//       for (const rf of removed) {
//         try {
//           await deleteTaskFile.mutateAsync({
//             workspaceId,
//             projectId,
//             boardId,
//             taskId,
//             fileName: rf.fileName,
//           });
//         } catch {
//           // best effort
//         }
//       }

//       // update the task fields and also send attachments so DB replaces them
//       const payload = {
//         projectId,
//         boardId,
//         taskId,
//         taskName: title,
//         // taskDescription: description,
//         taskDescription: currentDescription,
//         subtasks: (subtasks || []).map(s => ({
//           subtaskName: s.subtaskName || "",
//           subTaskDescription: s.subTaskDescription || "",
//           isCompleted: !!s.isCompleted,
//         })),
//         status,
//         assigneeIds: teamAssignee?._id ? [teamAssignee._id] : [],
//         reporterIds: teamReporter.map(u => u?._id).filter(Boolean),
//         priorityLevel: priority,
//         fileUrls: finalFiles,
//       };

//       await updateTask.mutateAsync(payload);

//       // backend safety net to delete unreferenced files and persist final set
//       await updateTaskFiles.mutateAsync({
//         workspaceId,
//         projectId,
//         boardId,
//         taskId,
//         fileUrls: finalFiles,
//       });
//     }

//     onClose?.();
//     if (mode === "create") {
//       setTitle("");
//       setDescription("");
//       reset({ taskDescription: "" }); 
//       setSubtasks([]);
//       setFileUrls([]);
//       setTeamAssignee(null);
//       setTeamReporter([]);
//       setPriority("medium");
//       setStatus(defaultStatus || "Todo");
//     }
//     setTimeout(() => refetch?.(), 0);
//   }

//   if (!open) return null;




//   return (
//     <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
//       <div className="fixed inset-0 bg-black/50 dark:bg-black/60" onClick={() => {
//         onClose?.()
//         setTimeout(() => refetch?.(), 0); 
//         }} />
//       <div
//         ref={shellRef}
//         className="relative w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col"
//       >
//         <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur">
//           <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
//             {mode === "edit" ? "Edit task" : "Add new task"}
//           </h3>
//           <button
//             onClick={() => {
//               onClose?.() 
//               setTimeout(() => refetch?.(), 0);}}
//             className="rounded-md px-2 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-700 dark:text-slate-100"
//           >
//             Close
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">Title</label>
//             {/* <input
//               className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="Task title"
//               value={title}
//               onChange={e => setTitle(e.target.value)}
//             /> */}
//             <input
//               placeholder="Task title"
//               value={title}
//               onChange={e => setTitle(e.target.value)}
//              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
//             focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
//             block w-full p-2.5
//             dark:bg-[#27272a] dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
//             dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500"
//              required
//             />
//             {showError && !title && <p className="text-red-500 mt-1">Title is required</p>}
//           </div>

//           <div className="mb-4">
//             {/* <label className="block mb-1 text-slate-700 dark:text-slate-200">Description</label> */}
//             <div className="relative">
//               <label className="block mb-1 text-slate-700 dark:text-slate-200 pr-28">
//                 Description
//               </label>

//               <button
//                 type="button"
//                 onClick={handleAiDescribeOrImprove}
//                 disabled={aiBusy}
//                 aria-busy={aiBusy}
//                 className="absolute top-0 right-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md
//                           bg-black/60 text-white hover:bg-black/70 disabled:opacity-50"
//                 title={(getValues("taskDescription") || "").trim() ? "Improve with AI" : "AI write auto"}
//               >
//                 {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
//                 <span>{aiBusy ? "Working..." : ( (getValues("taskDescription") || "").trim() ? "Improve with AI" : "AI write auto")}</span>
//               </button>
//             </div>
            
//             <Controller
//                 name="taskDescription"
//                 control={control}
//                 render={({ field: { value, onChange } }) => (
//                   <QuillEditor
//                     key={editorKey}
//                     value={value ?? ""}                 // RHF drives editor
//                     onChange={(html) => {
//                       onChange(html);                   // RHF update
//                       setDescription(html);             // optional local sync
//                     }}
//                   />
//                 )}
//               />

//           </div>



//           <div className="mb-5">
//             <div className="flex items-center justify-between">
//               <label className="block mb-1 text-slate-700 dark:text-slate-200">Subtasks</label>
//               <button type="button" onClick={addSubtaskRow} className="text-indigo-600 hover:text-indigo-700 font-medium">
//                 + Add Subtask
//               </button>
//             </div>
//             <div className="grid gap-2">
//               {subtasks.map((s, i) => (
//                 <div key={i} className="grid gap-2 border rounded-lg p-2 border-slate-200 dark:border-zinc-700">
//                   <input
//                     className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
//                     placeholder="Subtask name"
//                     value={s.subtaskName}
//                     onChange={e => updateSubtask(i, "subtaskName", e.target.value)}
//                   />
//                   <textarea
//                     className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
//                     placeholder="Subtask description"
//                     value={s.subTaskDescription}
//                     onChange={e => updateSubtask(i, "subTaskDescription", e.target.value)}
//                     rows={2}
//                   />
//                   <div className="flex items-center justify-between">
//                     <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
//                       <input
//                         type="checkbox"
//                         checked={!!s.isCompleted}
//                         onChange={e => updateSubtask(i, "isCompleted", e.target.checked)}
//                       />
//                       Completed
//                     </label>
//                     <button type="button" onClick={() => removeSubtask(i)} className="text-red-500 hover:text-red-600">
//                       Remove
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//             <StatusDropdown status={status} setStatus={setStatus} showError={showError} />
//             <PriorityDropdown priority={priority} setPriority={setPriority} showError={showError} />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//             <MemberPicker
//               label="Assignee"
//               members={currentBoard?.members || []}
//               multiple={false}
//               value={teamAssignee}
//               onChange={setTeamAssignee}
//               placeholder="Select assignee"
//             />
//             <MemberPicker
//               label="Reporter"
//               members={currentBoard?.members || []}
//               multiple={false}
//               value={teamReporter[0] || null}
//               onChange={u => setTeamReporter(u ? [u] : [])}
//               placeholder="Select reporter"
//             />
//           </div>

//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">Attachments</label>
//             <FileUploader
//               fileUrls={fileUrls}
//               setFileUrls={setFileUrls}
//               isEditMode={mode === "edit"}
//               taskId={taskId}
//             />
//           </div>

//           {showError && <div className="text-red-500">Please fill title status priority assignee and reporter</div>}
//         </form>

//         <div className="sticky bottom-0 z-10 flex justify-end gap-2 px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur">
//           <button
//             type="button"
//             className="px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-slate-100"
//             onClick={() => {
//               onClose?.()
//               setTimeout(() => refetch?.(), 0);
//             }}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => shellRef.current?.querySelector("form")?.requestSubmit()}
//             disabled={disabled}
//             className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
//           >
//             {busy ? "Saving..." : mode === "edit" ? "Save changes" : "Create"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }






















// // src/components/task/AddNewTaskModal.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { UseCreateTask, UseUpdateTask, UseGetTaskById } from "../../hooks/useTaskService";
// import { useBulkUploadTaskFiles, useUpdateTaskFiles, useDeleteTaskFile } from "../../hooks/useTaskFileService";
// import FileUploader from "./FileUploader";
// import MemberPicker from "./dropdown/MemberPicker";
// import StatusDropdown from "./dropdown/StatusDropdown";
// import PriorityDropdown from "./dropdown/PriorityDropdown";

// export default function AddNewTaskModal({
//   open,
//   onClose,
//   mode = "create",
//   taskId,
//   boardId,
//   defaultStatus,
//   currentBoard,
//   workspaceId,
//   projectId,
// }) {
//   const shellRef = useRef(null);

//   const createTask = UseCreateTask();
//   const updateTask = UseUpdateTask();
//   const bulkUpload = useBulkUploadTaskFiles();
//   const updateTaskFiles = useUpdateTaskFiles();
//   const deleteTaskFile = useDeleteTaskFile();
//   const { data: taskData } = UseGetTaskById(mode === "edit" ? taskId : undefined);

//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [status, setStatus] = useState(defaultStatus || "Todo");
//   const [priority, setPriority] = useState("medium");
//   const [teamAssignee, setTeamAssignee] = useState(null);
//   const [teamReporter, setTeamReporter] = useState([]);
//   const [subtasks, setSubtasks] = useState([]);

//   // fileUrls carries both existing server attachments and newly picked local files
//   // existing: { fileUrl, fileName, fileType, fileSize? }
//   // new local: { fileUrl: blob:, fileName, fileType, file, fileSize }
//   const [fileUrls, setFileUrls] = useState([]);
//   const [busy, setBusy] = useState(false);
//   const [showError, setShowError] = useState(false);

//   useEffect(() => {
//     if (defaultStatus && mode === "create") setStatus(defaultStatus);
//   }, [defaultStatus, mode]);

//   useEffect(() => {
//     document.body.style.overflow = open ? "hidden" : "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [open]);

//   // prefill edit
//   useEffect(() => {
//     if (mode !== "edit" || !taskData) return;
//     setTitle(taskData.taskName || "");
//     setDescription(taskData.taskDescription || "");
//     setStatus(taskData.status || defaultStatus || "Todo");
//     setPriority(taskData.priorityLevel || "medium");

//     // prefill attachments
//     const existing = Array.isArray(taskData.attachments) ? taskData.attachments : [];
//     setFileUrls(
//       existing.map((f) => ({
//         fileUrl: f.fileUrl,
//         fileName: f.fileName,
//         fileType: f.fileType,
//         fileSize: f.fileSize,
//         uploadedBy: f.uploadedBy,
//         uploadedAt: f.uploadedAt,
//       }))
//     );
//   }, [mode, taskData, defaultStatus]);

//   const disabled = busy;

//   async function handleSubmit(e) {
//     e?.preventDefault?.();
//     if (!title || !status) {
//       setShowError(true);
//       return;
//     }
//     setShowError(false);
//     setBusy(true);
//     try {
//       // separate new local and existing hosted
//       const existingHosted = fileUrls.filter((f) => !f.file);
//       const localNew = fileUrls.filter((f) => !!f.file);

//       // 1) upload new local files if any
//       let hostedNew = [];
//       if (localNew.length) {
//         const fd = new FormData();
//         localNew.forEach((f) => fd.append("files", f.file));
//         const bulk = await bulkUpload.mutateAsync({
//           workspaceId,
//           projectId,
//           boardId,
//           taskId: mode === "edit" ? taskId : "temp",
//           formData: fd,
//         });
//         hostedNew = (bulk.files || []).map((f) => ({
//           fileUrl: f.fileUrl,
//           fileName: f.fileName,
//           fileType: f.fileType,
//           fileSize: f.fileSize,
//         }));
//       }

//       // final set to save in DB
//       const finalFiles = [...existingHosted, ...hostedNew];

//       if (mode === "create") {
//         // create task with attachments
//         await createTask.mutateAsync({
//           boardId,
//           body: {
//             taskName: title,
//             taskDescription: description,
//             subtasks,
//             status,
//             assigneeIds: teamAssignee ? [teamAssignee._id] : [],
//             reporterIds: teamReporter?.[0]?._id ? [teamReporter[0]._id] : [],
//             priorityLevel: priority,
//             fileUrls: finalFiles,
//           },
//         });
//       } else {
//         // edit mode: detect removed files and delete them from disk
//         const keptNames = new Set(finalFiles.map((f) => f.fileName));
//         const removed = (taskData?.attachments || []).filter(
//           (f) => !keptNames.has(String(f.fileName))
//         );

//         // delete removed files one by one
//         for (const rf of removed) {
//           await deleteTaskFile.mutateAsync({
//             workspaceId,
//             projectId,
//             boardId,
//             taskId,
//             fileName: rf.fileName,
//           }).catch(() => {});
//         }

//         // update core fields and attachments in DB
//         await updateTask.mutateAsync({
//           taskId,
//           body: {
//             taskName: title,
//             taskDescription: description,
//             subtasks,
//             status,
//             assigneeIds: teamAssignee ? [teamAssignee._id] : [],
//             reporterIds: teamReporter?.[0]?._id ? [teamReporter[0]._id] : [],
//             priorityLevel: priority,
//             fileUrls: finalFiles,
//           },
//         });

//         // server side safety net also replaces attachments and deletes unreferenced
//         await updateTaskFiles.mutateAsync({
//           workspaceId,
//           projectId,
//           boardId,
//           taskId,
//           fileUrls: finalFiles,
//         });
//       }

//       onClose?.();
//     } catch (err) {
//       console.error(err);
//       alert(err?.message || "Failed to save task");
//     } finally {
//       setBusy(false);
//     }
//   }

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       <div className="absolute inset-0 bg-black/50" onClick={() => onClose?.()} />
//       <div
//         ref={shellRef}
//         className="relative w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-4 sm:p-6"
//       >
//         <h2 className="text-xl font-semibold mb-4">
//           {mode === "edit" ? "Edit task" : "Create task"}
//         </h2>

//         <form
//           onSubmit={handleSubmit}
//           className="space-y-4"
//         >
//           <input
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             placeholder="Task title"
//             className="w-full border rounded-lg px-3 py-2"
//           />
//           <textarea
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             placeholder="Description"
//             className="w-full border rounded-lg px-3 py-2"
//           />

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//             <StatusDropdown value={status} onChange={setStatus} />
//             <PriorityDropdown value={priority} onChange={setPriority} />
//             <MemberPicker
//               label="Assignee"
//               members={currentBoard?.members || []}
//               multiple={false}
//               value={teamAssignee}
//               onChange={setTeamAssignee}
//             />
//           </div>

//           <div>
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">Attachments</label>
//             <FileUploader
//               fileUrls={fileUrls}
//               setFileUrls={setFileUrls}
//               isEditMode={mode === "edit"}
//               taskId={taskId}
//             />
//           </div>

//           {showError && <div className="text-red-500">Please fill title and status</div>}
//         </form>

//         <div className="sticky bottom-0 z-10 flex justify-end gap-2 mt-4">
//           <button
//             type="button"
//             className="px-3 py-2 rounded-lg border"
//             onClick={() => onClose?.()}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => shellRef.current?.querySelector("form")?.requestSubmit()}
//             disabled={disabled}
//             className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
//           >
//             {busy ? "Saving..." : mode === "edit" ? "Save changes" : "Create"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }






























// // src/components/task/AddNewTaskModal.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { UseCreateTask, UseUpdateTask, UseGetTaskById } from "../../hooks/useTaskService";
// import { useBulkUploadTaskFiles, useUpdateTaskFiles } from "../../hooks/useTaskFileService";
// import FileUploader from "./FileUploader";
// import MemberPicker from "../task/dropdown/MemberPicker";
// import StatusDropdown from "../task/dropdown/StatusDropdown";
// import PriorityDropdown from "../task/dropdown/PriorityDropdown";

// // mode: "create" | "edit"
// // taskId: required only when mode === "edit"
// export default function AddNewTaskModal({
//   open,
//   onClose,
//   mode = "create",
//   taskId,
//   boardId,
//   defaultStatus,
//   currentBoard,
//   workspaceId,
//   projectId,
// }) {
//   const shellRef = useRef(null);

//   const createTask = UseCreateTask();
//   const updateTask = UseUpdateTask();
//   const bulkUpload = useBulkUploadTaskFiles();
//   const updateTaskFiles = useUpdateTaskFiles();
//   const { data: taskData, isFetching: isTaskLoading } = UseGetTaskById(mode === "edit" ? taskId : undefined);

//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [status, setStatus] = useState(defaultStatus || "Todo");
//   const [priority, setPriority] = useState("medium");
//   const [teamAssignee, setTeamAssignee] = useState(null);
//   const [teamReporter, setTeamReporter] = useState([]);
//   const [subtasks, setSubtasks] = useState([]);

//   // fileUrls carries both existing attachments and newly picked files
//   // existing: { fileUrl, fileName, fileType, fileSize? }
//   // new local: { fileUrl: blob:, fileName, fileType, file, size }
//   const [fileUrls, setFileUrls] = useState([]);
//   const [showError, setShowError] = useState(false);

//   useEffect(() => {
//     if (defaultStatus && mode === "create") setStatus(defaultStatus);
//   }, [defaultStatus, mode]);

//   useEffect(() => {
//     document.body.style.overflow = open ? "hidden" : "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [open]);

//   // prefill in edit mode
//   useEffect(() => {
//     if (mode !== "edit" || !taskData) return;

//     setTitle(taskData.taskName || "");
//     setDescription(taskData.taskDescription || "");
//     setStatus(taskData.status || defaultStatus || "Todo");
//     setPriority(taskData.priorityLevel || "medium");

//     // assignee single
//     const assigneeId = Array.isArray(taskData.assignee) && taskData.assignee[0];
//     if (assigneeId) {
//       const found = (currentBoard?.members || []).map(m => m.user || m)
//         .find(u => String(u?._id) === String(assigneeId));
//       setTeamAssignee(found ? { _id: found._id, firstName: found.firstName, profileImage: found.profilePicture || found.profileImage } : { _id: assigneeId });
//     } else {
//       setTeamAssignee(null);
//     }

//     // reporter single
//     const reporterId = Array.isArray(taskData.reporter) && taskData.reporter[0];
//     if (reporterId) {
//       const foundR = (currentBoard?.members || []).map(m => m.user || m)
//         .find(u => String(u?._id) === String(reporterId));
//       setTeamReporter(foundR ? [{ _id: foundR._id, firstName: foundR.firstName, profileImage: foundR.profilePicture || foundR.profileImage }] : [{ _id: reporterId }]);
//     } else {
//       setTeamReporter([]);
//     }

//     // subtasks
//     setSubtasks(Array.isArray(taskData.subtasks) ? taskData.subtasks.map(s => ({
//       subtaskName: s.subtaskName || "",
//       subTaskDescription: s.subTaskDescription || "",
//       isCompleted: !!s.isCompleted,
//     })) : []);

//     // existing attachments
//     const existing = Array.isArray(taskData.attachments) ? taskData.attachments.map(a => ({
//       fileUrl: a.fileUrl,
//       fileName: a.fileName,
//       fileType: a.fileType,
//       fileSize: a.fileSize,
//     })) : [];
//     setFileUrls(existing);
//   }, [mode, taskData, currentBoard, defaultStatus]);

//   useEffect(() => {
//     const onOutside = (e) => {
//       if (!open) return;
//       if (shellRef.current && !shellRef.current.contains(e.target)) onClose?.();
//     };
//     const onEsc = (e) => e.key === "Escape" && onClose?.();
//     if (open) {
//       document.addEventListener("mousedown", onOutside);
//       window.addEventListener("keydown", onEsc);
//     }
//     return () => {
//       document.removeEventListener("mousedown", onOutside);
//       window.removeEventListener("keydown", onEsc);
//     };
//   }, [open, onClose]);

//   const disabled = useMemo(() => {
//     const busy = createTask.isPending || updateTask.isPending || bulkUpload.isPending || updateTaskFiles.isPending || isTaskLoading;
//     return !title || !status || !priority || !teamAssignee || !teamReporter.length || busy;
//   }, [title, status, priority, teamAssignee, teamReporter, createTask.isPending, updateTask.isPending, bulkUpload.isPending, updateTaskFiles.isPending, isTaskLoading]);

//   const addSubtaskRow = () => setSubtasks(p => [...p, { subtaskName: "", subTaskDescription: "", isCompleted: false }]);
//   const updateSubtask = (i, k, v) => setSubtasks(p => p.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
//   const removeSubtask = (i) => setSubtasks(p => p.filter((_, idx) => idx !== i));

//   const makeFileUrl = (tId, storedName) => {
//     const base =
//       import.meta.env.VITE_TASK_File_SERVICE_URL ||
//       window.__API_URL__ ||
//       window.location.origin.replace(":5173", ":5002");
//     return `${base}/taskFile/files/workspace/${workspaceId}/project/${projectId}/board/${boardId}/task/${tId}/${encodeURIComponent(storedName)}`;
//   };

//   const dedupeByNameSize = (arr) => {
//     const seen = new Set();
//     const out = [];
//     for (const f of arr) {
//       const n = f?.name || f?.fileName;
//       const s = f?.size || f?.fileSize || 0;
//       const key = `${n}-${s}`;
//       if (!seen.has(key)) {
//         seen.add(key);
//         out.push(f);
//       }
//     }
//     return out;
//   };

//   async function handleSubmit(e) {
//     e.preventDefault();

//     if (!title || !status || !priority || !teamAssignee || !teamReporter.length) {
//       setShowError(true);
//       return;
//     }
//     setShowError(false);

//     if (mode === "create") {
//       const payload = {
//         boardId,
//         taskName: title,
//         taskDescription: description,
//         subtasks: (subtasks || []).map((s) => ({
//           subtaskName: s.subtaskName || "",
//           subTaskDescription: s.subTaskDescription || "",
//           isCompleted: !!s.isCompleted,
//         })),
//         status,
//         assigneeIds: teamAssignee?._id ? [teamAssignee._id] : [],
//         reporterIds: teamReporter.map((u) => u?._id).filter(Boolean),
//         priorityLevel: priority,
//         fileUrls: [], // attach later
//       };

//       const res = await createTask.mutateAsync(payload);
//       const newTaskId = res?.taskId;
//       if (!newTaskId) return;

//       const localFiles = (fileUrls || [])
//         .map((f) => f?.file || f)
//         .filter((x) => x && x instanceof File);

//       if (localFiles.length) {
//         const fd = new FormData();
//         for (const f of dedupeByNameSize(localFiles)) {
//           fd.append("files", f); // field name must be "files"
//         }
//         const up = await bulkUpload.mutateAsync({ workspaceId, projectId, boardId, taskId: newTaskId, formData: fd });
//         const saved = up?.files || [];

//         const hosted = saved.map((s) => ({
//           fileUrl: makeFileUrl(newTaskId, s.filename),
//           fileName: s.originalname,
//           fileType: s.mimetype,
//           fileSize: s.size,
//           isValidUrl: true,
//         }));

//         if (hosted.length) {
//           await updateTaskFiles.mutateAsync({ workspaceId, projectId, boardId, taskId: newTaskId, fileUrls: hosted });
//         }
//       }

//     } else {
//       // edit mode
//       // split existing vs new
//       const existing = (fileUrls || []).filter(f => !f.file).map(f => ({
//         fileUrl: f.fileUrl,
//         fileName: f.fileName,
//         fileType: f.fileType,
//         fileSize: f.fileSize,
//         isValidUrl: true,
//       }));

//       const newLocal = (fileUrls || [])
//         .map(f => f?.file ? f.file : null)
//         .filter(Boolean);

//       let hostedNew = [];
//       if (newLocal.length) {
//         const fd = new FormData();
//         for (const f of dedupeByNameSize(newLocal)) {
//           fd.append("files", f);
//         }
//         const up = await bulkUpload.mutateAsync({ workspaceId, projectId, boardId, taskId, formData: fd });
//         const saved = up?.files || [];
//         hostedNew = saved.map((s) => ({
//           fileUrl: makeFileUrl(taskId, s.filename),
//           fileName: s.originalname,
//           fileType: s.mimetype,
//           fileSize: s.size,
//           isValidUrl: true,
//         }));
//       }

//       const finalFiles = [...existing, ...hostedNew];

//       const payload = {
//         taskId,
//         taskName: title,
//         taskDescription: description,
//         subtasks: (subtasks || []).map((s) => ({
//           subtaskName: s.subtaskName || "",
//           subTaskDescription: s.subTaskDescription || "",
//           isCompleted: !!s.isCompleted,
//         })),
//         status,
//         assigneeIds: teamAssignee?._id ? [teamAssignee._id] : [],
//         reporterIds: teamReporter.map((u) => u?._id).filter(Boolean),
//         priorityLevel: priority,
//         fileUrls: finalFiles, // replace attachments
//       };

//       await updateTask.mutateAsync(payload);
//     }

//     onClose?.();
//     if (mode === "create") {
//       setTitle(""); setDescription(""); setSubtasks([]); setFileUrls([]);
//       setTeamAssignee(null); setTeamReporter([]); setPriority("medium"); setStatus(defaultStatus || "Todo");
//     }
//   }

//   if (!open) return null;

//   const busy = createTask.isPending || updateTask.isPending || bulkUpload.isPending || updateTaskFiles.isPending || isTaskLoading;

//   return (
//     <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
//       <div className="fixed inset-0 bg-black/50 dark:bg-black/60" onClick={() => onClose?.()} />
//       <div
//         ref={shellRef}
//         className="relative w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col"
//       >
//         <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur">
//           <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
//             {mode === "edit" ? "Edit task" : "Add new task"}
//           </h3>
//           <button
//             onClick={() => onClose?.()}
//             className="rounded-md px-2 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-700 dark:text-slate-100"
//           >
//             Close
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">Title</label>
//             <input
//               className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="Task title"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//             />
//             {showError && !title && <p className="text-red-500 mt-1">Title is required</p>}
//           </div>

//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">Description</label>
//             <textarea
//               className="w-full min-h-[100px] rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="Describe the task"
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               rows={4}
//             />
//           </div>

//           <div className="mb-5">
//             <div className="flex items-center justify-between">
//               <label className="block mb-1 text-slate-700 dark:text-slate-200">Subtasks</label>
//               <button type="button" onClick={addSubtaskRow} className="text-indigo-600 hover:text-indigo-700 font-medium">+ Add Subtask</button>
//             </div>
//             <div className="grid gap-2">
//               {subtasks.map((s, i) => (
//                 <div key={i} className="grid gap-2 border rounded-lg p-2 border-slate-200 dark:border-zinc-700">
//                   <input
//                     className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
//                     placeholder="Subtask name"
//                     value={s.subtaskName}
//                     onChange={(e) => updateSubtask(i, "subtaskName", e.target.value)}
//                   />
//                   <textarea
//                     className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
//                     placeholder="Subtask description"
//                     value={s.subTaskDescription}
//                     onChange={(e) => updateSubtask(i, "subTaskDescription", e.target.value)}
//                     rows={2}
//                   />
//                   <div className="flex items-center justify-between">
//                     <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
//                       <input
//                         type="checkbox"
//                         checked={!!s.isCompleted}
//                         onChange={(e) => updateSubtask(i, "isCompleted", e.target.checked)}
//                       />
//                       Completed
//                     </label>
//                     <button type="button" onClick={() => removeSubtask(i)} className="text-red-500 hover:text-red-600">
//                       Remove
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//             <StatusDropdown status={status} setStatus={setStatus} showError={showError} />
//             <PriorityDropdown priority={priority} setPriority={setPriority} showError={showError} />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//             <MemberPicker
//               label="Assignee"
//               members={currentBoard?.members || []}
//               multiple={false}
//               value={teamAssignee}
//               onChange={setTeamAssignee}
//               placeholder="Select assignee"
//             />
//             <MemberPicker
//               label="Reporter"
//               members={currentBoard?.members || []}
//               multiple={false}
//               value={teamReporter[0] || null}
//               onChange={(u) => setTeamReporter(u ? [u] : [])}
//               placeholder="Select reporter"
//             />
//           </div>

//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">Attachments</label>
//             <FileUploader
//               fileUrls={fileUrls}
//               setFileUrls={setFileUrls}
//               isEditMode={mode === "edit"}
//               taskId={taskId}
//             />
//           </div>

//           {showError && <div className="text-red-500">Please fill title status priority assignee and reporter</div>}
//         </form>

//         <div className="sticky bottom-0 z-10 flex justify-end gap-2 px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur">
//           <button
//             type="button"
//             className="px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-slate-100"
//             onClick={() => onClose?.()}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => shellRef.current?.querySelector("form")?.requestSubmit()}
//             disabled={disabled}
//             className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
//           >
//             {busy ? "Saving..." : mode === "edit" ? "Save changes" : "Create"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

































// // src/components/task/AddNewTaskModal.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { UseCreateTask, UseUpdateTask, UseGetTaskById } from "../../hooks/useTaskService";
// import { useBulkUploadTaskFiles, useUpdateTaskFiles } from "../../hooks/useTaskFileService";
// import FileUploader from "./FileUploader";
// import MemberPicker from "../task/dropdown/MemberPicker";
// import StatusDropdown from "../task/dropdown/StatusDropdown";
// import PriorityDropdown from "../task/dropdown/PriorityDropdown";

// // mode: "create" | "edit"
// // taskId: required only when mode === "edit"
// export default function AddNewTaskModal({
//   open,
//   onClose,
//   mode = "create",
//   taskId,
//   boardId,
//   defaultStatus,
//   currentBoard,
//   workspaceId,
//   projectId,
// }) {
//   const shellRef = useRef(null);

//   const createTask = UseCreateTask();
//   const updateTask = UseUpdateTask();
//   const bulkUpload = useBulkUploadTaskFiles();
//   const updateTaskFiles = useUpdateTaskFiles();
//   const { data: taskData, isFetching: isTaskLoading } = UseGetTaskById(mode === "edit" ? taskId : undefined);

//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [status, setStatus] = useState(defaultStatus || "Todo");
//   const [priority, setPriority] = useState("medium");
//   const [teamAssignee, setTeamAssignee] = useState(null);
//   const [teamReporter, setTeamReporter] = useState([]);
//   const [subtasks, setSubtasks] = useState([]);
//   // fileUrls state carries both existing attachments and newly picked files
//   // existing: { fileUrl, fileName, fileType, fileSize? }
//   // new local: { fileUrl: blob:, fileName, fileType, file, size }
//   const [fileUrls, setFileUrls] = useState([]);
//   const [showError, setShowError] = useState(false);

//   useEffect(() => {
//     if (defaultStatus && mode === "create") setStatus(defaultStatus);
//   }, [defaultStatus, mode]);

//   useEffect(() => {
//     document.body.style.overflow = open ? "hidden" : "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [open]);

//   // prefill in edit mode
//   useEffect(() => {
//     if (mode !== "edit" || !taskData) return;

//     // taskData includes boardId and status if you returned it that way
//     setTitle(taskData.taskName || "");
//     setDescription(taskData.taskDescription || "");
//     setStatus(taskData.status || defaultStatus || "Todo");
//     setPriority(taskData.priorityLevel || "medium");

//     // assignee is array in schema, we use single select
//     const assigneeId = Array.isArray(taskData.assignee) && taskData.assignee[0];
//     if (assigneeId) {
//       // currentBoard.members may have full objects
//       const found = (currentBoard?.members || []).map(m => m.user || m)
//         .find(u => String(u?._id) === String(assigneeId));
//       setTeamAssignee(found ? { _id: found._id, firstName: found.firstName, profileImage: found.profilePicture || found.profileImage } : { _id: assigneeId });
//     } else {
//       setTeamAssignee(null);
//     }

//     // reporter single in UI
//     const reporterId = Array.isArray(taskData.reporter) && taskData.reporter[0];
//     if (reporterId) {
//       const foundR = (currentBoard?.members || []).map(m => m.user || m)
//         .find(u => String(u?._id) === String(reporterId));
//       setTeamReporter(foundR ? [{ _id: foundR._id, firstName: foundR.firstName, profileImage: foundR.profilePicture || foundR.profileImage }] : [{ _id: reporterId }]);
//     } else {
//       setTeamReporter([]);
//     }

//     // subtasks
//     setSubtasks(Array.isArray(taskData.subtasks) ? taskData.subtasks.map(s => ({
//       subtaskName: s.subtaskName || "",
//       subTaskDescription: s.subTaskDescription || "",
//       isCompleted: !!s.isCompleted,
//     })) : []);

//     // existing attachments to preview list
//     const existing = Array.isArray(taskData.attachments) ? taskData.attachments.map(a => ({
//       fileUrl: a.fileUrl,
//       fileName: a.fileName,
//       fileType: a.fileType,
//       fileSize: a.fileSize,
//     })) : [];
//     setFileUrls(existing);
//   }, [mode, taskData, currentBoard, defaultStatus]);

//   useEffect(() => {
//     const onOutside = (e) => {
//       if (!open) return;
//       if (shellRef.current && !shellRef.current.contains(e.target)) onClose?.();
//     };
//     const onEsc = (e) => e.key === "Escape" && onClose?.();
//     if (open) {
//       document.addEventListener("mousedown", onOutside);
//       window.addEventListener("keydown", onEsc);
//     }
//     return () => {
//       document.removeEventListener("mousedown", onOutside);
//       window.removeEventListener("keydown", onEsc);
//     };
//   }, [open, onClose]);

//   const disabled = useMemo(() => {
//     const busy = createTask.isPending || updateTask.isPending || bulkUpload.isPending || updateTaskFiles.isPending || isTaskLoading;
//     return !title || !status || !priority || !teamAssignee || !teamReporter.length || busy;
//   }, [title, status, priority, teamAssignee, teamReporter, createTask.isPending, updateTask.isPending, bulkUpload.isPending, updateTaskFiles.isPending, isTaskLoading]);

//   const addSubtaskRow = () => setSubtasks(p => [...p, { subtaskName: "", subTaskDescription: "", isCompleted: false }]);
//   const updateSubtask = (i, k, v) => setSubtasks(p => p.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
//   const removeSubtask = (i) => setSubtasks(p => p.filter((_, idx) => idx !== i));

//   const makeFileUrl = (tId, storedName) => {
//     const base =
//       import.meta.env.VITE_TASK_File_SERVICE_URL ||
//       window.__API_URL__ ||
//       window.location.origin.replace(":5173", ":5002");
//     return `${base}/taskFile/files/workspace/${workspaceId}/project/${projectId}/board/${boardId}/task/${tId}/${encodeURIComponent(storedName)}`;
//   };

//   const dedupeByNameSize = (arr) => {
//     const seen = new Set();
//     const out = [];
//     for (const f of arr) {
//       const n = f?.name || f?.fileName;
//       const s = f?.size || f?.fileSize || 0;
//       const key = `${n}-${s}`;
//       if (!seen.has(key)) {
//         seen.add(key);
//         out.push(f);
//       }
//     }
//     return out;
//   };

//   async function handleSubmit(e) {
//     e.preventDefault();

//     if (!title || !status || !priority || !teamAssignee || !teamReporter.length) {
//       setShowError(true);
//       return;
//     }
//     setShowError(false);

//     if (mode === "create") {
//       const payload = {
//         boardId,
//         taskName: title,
//         taskDescription: description,
//         subtasks: (subtasks || []).map((s) => ({
//           subtaskName: s.subtaskName || "",
//           subTaskDescription: s.subTaskDescription || "",
//           isCompleted: !!s.isCompleted,
//         })),
//         status,
//         assigneeIds: teamAssignee?._id ? [teamAssignee._id] : [],
//         reporterIds: teamReporter.map((u) => u?._id).filter(Boolean),
//         priorityLevel: priority,
//         fileUrls: [], // attach later
//       };

//       const res = await createTask.mutateAsync(payload);
//       const newTaskId = res?.taskId;
//       if (!newTaskId) return;

//       const localFiles = (fileUrls || [])
//         .map((f) => f?.file || f)
//         .filter((x) => x && x instanceof File);

//       if (localFiles.length) {
//         const fd = new FormData();
//         for (const f of dedupeByNameSize(localFiles)) {
//           fd.append("files", f); // field name "files"
//         }
//         const up = await bulkUpload.mutateAsync({ workspaceId, projectId, boardId, taskId: newTaskId, formData: fd });
//         const saved = up?.files || [];

//         const hosted = saved.map((s) => ({
//           fileUrl: makeFileUrl(newTaskId, s.filename),
//           fileName: s.originalname,
//           fileType: s.mimetype,
//           fileSize: s.size,
//           isValidUrl: true,
//         }));

//         if (hosted.length) {
//           await updateTaskFiles.mutateAsync({ workspaceId, projectId, boardId, taskId: newTaskId, fileUrls: hosted });
//         }
//       }

//     } else {
//       // edit mode
//       // split existing vs new
//       const existing = (fileUrls || []).filter(f => !f.file).map(f => ({
//         fileUrl: f.fileUrl,
//         fileName: f.fileName,
//         fileType: f.fileType,
//         fileSize: f.fileSize,
//         isValidUrl: true,
//       }));

//       const newLocal = (fileUrls || [])
//         .map(f => f?.file ? f.file : null)
//         .filter(Boolean);

//       let hostedNew = [];
//       if (newLocal.length) {
//         const fd = new FormData();
//         for (const f of dedupeByNameSize(newLocal)) {
//           fd.append("files", f);
//         }
//         const up = await bulkUpload.mutateAsync({ workspaceId, projectId, boardId, taskId, formData: fd });
//         const saved = up?.files || [];
//         hostedNew = saved.map((s) => ({
//           fileUrl: makeFileUrl(taskId, s.filename),
//           fileName: s.originalname,
//           fileType: s.mimetype,
//           fileSize: s.size,
//           isValidUrl: true,
//         }));
//       }

//       const finalFiles = [...existing, ...hostedNew];

//       const payload = {
//         taskId,
//         taskName: title,
//         taskDescription: description,
//         subtasks: (subtasks || []).map((s) => ({
//           subtaskName: s.subtaskName || "",
//           subTaskDescription: s.subTaskDescription || "",
//           isCompleted: !!s.isCompleted,
//         })),
//         status,
//         assigneeIds: teamAssignee?._id ? [teamAssignee._id] : [],
//         reporterIds: teamReporter.map((u) => u?._id).filter(Boolean),
//         priorityLevel: priority,
//         fileUrls: finalFiles, // replace attachments
//       };

//       await updateTask.mutateAsync(payload);
//     }

//     onClose?.();
//     if (mode === "create") {
//       setTitle(""); setDescription(""); setSubtasks([]); setFileUrls([]);
//       setTeamAssignee(null); setTeamReporter([]); setPriority("medium"); setStatus(defaultStatus || "Todo");
//     }
//   }

//   if (!open) return null;

//   const busy = createTask.isPending || updateTask.isPending || bulkUpload.isPending || updateTaskFiles.isPending || isTaskLoading;

//   return (
//     <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
//       <div className="fixed inset-0 bg-black/50 dark:bg-black/60" onClick={() => onClose?.()} />
//       <div
//         ref={shellRef}
//         className="relative w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col"
//       >
//         <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur">
//           <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
//             {mode === "edit" ? "Edit task" : "Add new task"}
//           </h3>
//           <button
//             onClick={() => onClose?.()}
//             className="rounded-md px-2 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-700 dark:text-slate-100"
//           >
//             Close
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">Title</label>
//             <input
//               className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="Task title"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//             />
//             {showError && !title && <p className="text-red-500 mt-1">Title is required</p>}
//           </div>

//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">Description</label>
//             <textarea
//               className="w-full min-h-[100px] rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="Describe the task"
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               rows={4}
//             />
//           </div>

//           <div className="mb-5">
//             <div className="flex items-center justify-between">
//               <label className="block mb-1 text-slate-700 dark:text-slate-200">Subtasks</label>
//               <button type="button" onClick={addSubtaskRow} className="text-indigo-600 hover:text-indigo-700 font-medium">+ Add Subtask</button>
//             </div>
//             <div className="grid gap-2">
//               {subtasks.map((s, i) => (
//                 <div key={i} className="grid gap-2 border rounded-lg p-2 border-slate-200 dark:border-zinc-700">
//                   <input
//                     className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
//                     placeholder="Subtask name"
//                     value={s.subtaskName}
//                     onChange={(e) => updateSubtask(i, "subtaskName", e.target.value)}
//                   />
//                   <textarea
//                     className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
//                     placeholder="Subtask description"
//                     value={s.subTaskDescription}
//                     onChange={(e) => updateSubtask(i, "subTaskDescription", e.target.value)}
//                     rows={2}
//                   />
//                   <div className="flex items-center justify-between">
//                     <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
//                       <input
//                         type="checkbox"
//                         checked={!!s.isCompleted}
//                         onChange={(e) => updateSubtask(i, "isCompleted", e.target.checked)}
//                       />
//                       Completed
//                     </label>
//                     <button type="button" onClick={() => removeSubtask(i)} className="text-red-500 hover:text-red-600">
//                       Remove
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//             <StatusDropdown status={status} setStatus={setStatus} showError={showError} />
//             <PriorityDropdown priority={priority} setPriority={setPriority} showError={showError} />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//             <MemberPicker
//               label="Assignee"
//               members={currentBoard?.members || []}
//               multiple={false}
//               value={teamAssignee}
//               onChange={setTeamAssignee}
//               placeholder="Select assignee"
//             />
//             <MemberPicker
//               label="Reporter"
//               members={currentBoard?.members || []}
//               multiple={false}
//               value={teamReporter[0] || null}
//               onChange={(u) => setTeamReporter(u ? [u] : [])}
//               placeholder="Select reporter"
//             />
//           </div>

//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">Attachments</label>
//             <FileUploader
//               fileUrls={fileUrls}
//               setFileUrls={setFileUrls}
//               isEditMode={mode === "edit"}
//               taskId={taskId}
//             />
//           </div>

//           {showError && <div className="text-red-500">Please fill title status priority assignee and reporter</div>}
//         </form>

//         <div className="sticky bottom-0 z-10 flex justify-end gap-2 px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur">
//           <button
//             type="button"
//             className="px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-slate-100"
//             onClick={() => onClose?.()}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => shellRef.current?.querySelector("form")?.requestSubmit()}
//             disabled={disabled}
//             className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
//           >
//             {busy ? "Saving..." : mode === "edit" ? "Save changes" : "Create"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }





























// // src/components/task/AddNewTaskModal.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { UseCreateTask } from "../../hooks/useTaskService";
// import {
//   useBulkUploadTaskFiles,
//   useUpdateTaskFiles,
// } from "../../hooks/useTaskFileService";

// // your existing components
// import FileUploader from "./FileUploader";
// import MemberPicker from "../task/dropdown/MemberPicker";
// import StatusDropdown from "../task/dropdown/StatusDropdown";
// import PriorityDropdown from "../task/dropdown/PriorityDropdown";

// export default function AddNewTaskModal({
//   open,
//   onClose,
//   boardId,
//   defaultStatus,
//   currentBoard,
//   workspaceId,   
//   projectId,     
// }) {
//   const shellRef = useRef(null);

//   // mutations
//   const createTask = UseCreateTask();
//   const bulkUpload = useBulkUploadTaskFiles();
//   const updateTaskFiles = useUpdateTaskFiles();

//   // form state
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [status, setStatus] = useState(defaultStatus || "Todo");
//   const [priority, setPriority] = useState("medium");

//   // single select for both
//   const [teamAssignee, setTeamAssignee] = useState(null);
//   const [teamReporter, setTeamReporter] = useState([]);

//   // subtasks optional
//   const [subtasks, setSubtasks] = useState([]);

//   // files from FileUploader
//   const [fileUrls, setFileUrls] = useState([]);

//   const [showError, setShowError] = useState(false);

//   useEffect(() => {
//     if (defaultStatus) setStatus(defaultStatus);
//   }, [defaultStatus]);

//   useEffect(() => {
//     document.body.style.overflow = open ? "hidden" : "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [open]);

//   useEffect(() => {
//     const onOutside = (e) => {
//       if (!open) return;
//       if (shellRef.current && !shellRef.current.contains(e.target)) onClose?.();
//     };
//     const onEsc = (e) => e.key === "Escape" && onClose?.();
//     if (open) {
//       document.addEventListener("mousedown", onOutside);
//       window.addEventListener("keydown", onEsc);
//     }
//     return () => {
//       document.removeEventListener("mousedown", onOutside);
//       window.removeEventListener("keydown", onEsc);
//     };
//   }, [open, onClose]);

//   const disabled = useMemo(() => {
//     return (
//       !title ||
//       !status ||
//       !priority ||
//       !teamAssignee ||
//       !teamReporter.length ||
//       createTask.isPending ||
//       bulkUpload.isPending ||
//       updateTaskFiles.isPending
//     );
//   }, [
//     title,
//     status,
//     priority,
//     teamAssignee,
//     teamReporter,
//     createTask.isPending,
//     bulkUpload.isPending,
//     updateTaskFiles.isPending,
//   ]);

//   const addSubtaskRow = () =>
//     setSubtasks((p) => [
//       ...p,
//       { subtaskName: "", subTaskDescription: "", isCompleted: false },
//     ]);

//   const updateSubtask = (i, k, v) =>
//     setSubtasks((p) => p.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));

//   const removeSubtask = (i) =>
//     setSubtasks((p) => p.filter((_, idx) => idx !== i));

//   // make absolute file URL the same way your backend serves it
//   const makeFileUrl = (taskId, storedName) => {
//     const base =
//       import.meta.env.VITE_TASK_File_SERVICE_URL ||
//       window.__API_URL__ ||
//       window.location.origin.replace(":5173", ":5002");
//     return `${base}/taskFile/files/workspace/${workspaceId}/project/${projectId}/board/${boardId}/task/${taskId}/${encodeURIComponent(
//     storedName
//   )}`;
//   };

//   // simple dedupe so one file does not get uploaded twice
//   const dedupeByNameSize = (arr) => {
//     const seen = new Set();
//     const out = [];
//     for (const f of arr) {
//       const key = `${f?.name}-${f?.size}`;
//       if (!seen.has(key)) {
//         seen.add(key);
//         out.push(f);
//       }
//     }
//     return out;
//   };

//   async function handleSubmit(e) {
//     e.preventDefault();

//     if (!title || !status || !priority || !teamAssignee || !teamReporter.length) {
//       setShowError(true);
//       return;
//     }
//     setShowError(false);

//     const payload = {
//       boardId,
//       taskName: title,
//       taskDescription: description,
//       subtasks: (subtasks || []).map((s) => ({
//         subtaskName: s.subtaskName || "",
//         subTaskDescription: s.subTaskDescription || "",
//         isCompleted: !!s.isCompleted,
//       })),
//       status,
//       assigneeIds: teamAssignee?._id ? [teamAssignee._id] : [],
//       reporterIds: teamReporter.map((u) => u?._id).filter(Boolean),
//       priorityLevel: priority,
//       fileUrls: [], // will attach after upload
//     };

//     // 1) create task
//     const res = await createTask.mutateAsync(payload);
//     const taskId = res?.taskId;
//     if (!taskId) return;

//     // 2) bulk upload all local files in a single request
//     const localFiles = (fileUrls || [])
//       .map((f) => f?.file || f)
//       .filter(Boolean);

//     if (localFiles.length) {
//       const fd = new FormData();
//       for (const f of dedupeByNameSize(localFiles)) {
//         fd.append("files", f); // IMPORTANT field name
//       }
//       const up = await bulkUpload.mutateAsync(
//         { 
//           workspaceId,
//           projectId,
//           boardId,
//           taskId, 
//           formData: fd 
//         }
//       );
//       const saved = up?.files || [];

//       // 3) persist attachments into task
//       const hosted = saved.map((s) => ({
//         fileUrl: makeFileUrl(taskId, s.filename),
//         fileName: s.originalname,
//         fileType: s.mimetype,
//         fileSize: s.size,
//         isValidUrl: true,
//       }));

//       if (hosted.length) {
//         await updateTaskFiles.mutateAsync(
//           { 
//             workspaceId,
//             projectId,
//             boardId,
//             taskId, 
//             fileUrls: hosted 
//           }
//         );
//       }
//     }

//     // 4) reset and close
//     onClose?.();
//     setTitle("");
//     setDescription("");
//     setSubtasks([]);
//     setFileUrls([]);
//     setTeamAssignee(null);
//     setTeamReporter([]);
//     setPriority("medium");
//     setStatus(defaultStatus || "Todo");
//   }

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
//       <div
//         className="fixed inset-0 bg-black/50 dark:bg-black/60"
//         onClick={() => onClose?.()}
//       />
//       <div
//         ref={shellRef}
//         className="relative w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col"
//       >
//         {/* header */}
//         <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur">
//           <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
//             Add new task
//           </h3>
//           <button
//             onClick={() => onClose?.()}
//             className="rounded-md px-2 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-700 dark:text-slate-100"
//           >
//             Close
//           </button>
//         </div>

//         {/* body */}
//         <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
//           {/* title */}
//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">
//               Title
//             </label>
//             <input
//               className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="Task title"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//             />
//             {showError && !title && (
//               <p className="text-red-500 mt-1">Title is required</p>
//             )}
//           </div>

//           {/* description */}
//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">
//               Description
//             </label>
//             <textarea
//               className="w-full min-h-[100px] rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="Describe the task"
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               rows={4}
//             />
//           </div>

//           {/* subtasks */}
//           <div className="mb-5">
//             <div className="flex items-center justify-between">
//               <label className="block mb-1 text-slate-700 dark:text-slate-200">
//                 Subtasks
//               </label>
//               <button
//                 type="button"
//                 onClick={addSubtaskRow}
//                 className="text-indigo-600 hover:text-indigo-700 font-medium"
//               >
//                 + Add Subtask
//               </button>
//             </div>
//             <div className="grid gap-2">
//               {subtasks.map((s, i) => (
//                 <div
//                   key={i}
//                   className="grid gap-2 border rounded-lg p-2 border-slate-200 dark:border-zinc-700"
//                 >
//                   <input
//                     className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
//                     placeholder="Subtask name"
//                     value={s.subtaskName}
//                     onChange={(e) =>
//                       updateSubtask(i, "subtaskName", e.target.value)
//                     }
//                   />
//                   <textarea
//                     className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
//                     placeholder="Subtask description"
//                     value={s.subTaskDescription}
//                     onChange={(e) =>
//                       updateSubtask(i, "subTaskDescription", e.target.value)
//                     }
//                     rows={2}
//                   />
//                   <div className="flex items-center justify-between">
//                     <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
//                       <input
//                         type="checkbox"
//                         checked={!!s.isCompleted}
//                         onChange={(e) =>
//                           updateSubtask(i, "isCompleted", e.target.checked)
//                         }
//                       />
//                       Completed
//                     </label>
//                     <button
//                       type="button"
//                       onClick={() => removeSubtask(i)}
//                       className="text-red-500 hover:text-red-600"
//                     >
//                       Remove
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* row: status + priority */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//             <StatusDropdown
//               status={status}
//               setStatus={setStatus}
//               showError={showError}
//             />
//             <PriorityDropdown
//               priority={priority}
//               setPriority={setPriority}
//               showError={showError}
//             />
//           </div>

//           {/* row: assignee + reporter */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//             <MemberPicker
//               label="Assignee"
//               members={currentBoard?.members || []}
//               multiple={false}
//               value={teamAssignee}
//               onChange={setTeamAssignee}
//               placeholder="Select assignee"
//             />
//             <MemberPicker
//               label="Reporter"
//               members={currentBoard?.members || []}
//               multiple={false}
//               value={teamReporter[0] || null}
//               onChange={(u) => setTeamReporter(u ? [u] : [])}
//               placeholder="Select reporter"
//             />
//           </div>

//           {/* attachments */}
//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">
//               Attachments
//             </label>
//             <FileUploader
//               onChange={setFileUrls}     // your uploader will call this with selected files
//               fileUrls={fileUrls}
//               setFileUrls={setFileUrls}
//               isEditMode={false}
//             />
//           </div>

//           {showError && (
//             <div className="text-red-500">
//               Please fill title, status, priority, assignee and reporter
//             </div>
//           )}
//         </form>

//         {/* footer */}
//         <div className="sticky bottom-0 z-10 flex justify-end gap-2 px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur">
//           <button
//             type="button"
//             className="px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-slate-100"
//             onClick={() => onClose?.()}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => shellRef.current?.querySelector("form")?.requestSubmit()}
//             disabled={disabled}
//             className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
//           >
//             {createTask.isPending || bulkUpload.isPending || updateTaskFiles.isPending
//               ? "Saving..."
//               : "Create"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
