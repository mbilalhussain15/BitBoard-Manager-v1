import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { UseCreateTask, UseUpdateTask, UseGetTaskById } from "../../../hooks/useTaskService";
import { useBulkUploadTaskFiles, useUpdateTaskFiles, useDeleteTaskFile } from "../../../hooks/useTaskFileService";
import FileUploader from "../FileUploader";
import MemberPicker from "../../task/dropdown/MemberPicker";
import StatusDropdown from "../../task/dropdown/StatusDropdown";
import PriorityDropdown from "../../task/dropdown/PriorityDropdown";
import QuillEditor from "../../form/QuillEditor/QuillEditor";
import { useForm, Controller } from "react-hook-form";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UseAutoDescribeTask, UseImproveTask } from "../../../hooks/useAiPlannerService";

export default function AddNewTaskManual({
  mode = "create",
  taskId,
  boardId,
  defaultStatus,
  currentBoard,
  workspaceId,
  projectId,
  refetch,
  setFooter,
  onClose,
}) {
  const formRef = useRef(null);

  const createTask = UseCreateTask();
  const updateTask = UseUpdateTask();
  const bulkUpload = useBulkUploadTaskFiles();
  const updateTaskFiles = useUpdateTaskFiles();
  const deleteTaskFile = useDeleteTaskFile();

  const { data: taskData, isFetching: isTaskLoading } = UseGetTaskById(
    mode === "edit" ? { taskId, projectId } : {}
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(defaultStatus || "Todo");
  const [priority, setPriority] = useState("medium");
  const [teamAssignee, setTeamAssignee] = useState(null);
  const [teamReporter, setTeamReporter] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [fileUrls, setFileUrls] = useState([]);
  const [showError, setShowError] = useState(false);

  const [aiThinking, setAiThinking] = useState(false);
  const { mutateAsync: autoDescribeAsync, isPending: isAutoDescribing } = UseAutoDescribeTask();
  const { mutateAsync: improveAsync, isPending: isImproving } = UseImproveTask();
  const aiBusy = aiThinking || isAutoDescribing || isImproving;

  // normalize members so MemberPicker always gets plain user objects
  const normalizedMembers = useMemo(
    () => (currentBoard?.members || []).map(m => m?.user || m).filter(Boolean),
    [currentBoard]
  );

  useEffect(() => {
    if (defaultStatus && mode === "create") setStatus(defaultStatus);
  }, [defaultStatus, mode]);

  const { control, setValue, watch, getValues, reset } = useForm({
    defaultValues: { taskDescription: "" },
  });

  useEffect(() => {
    const sub = watch((value, { name }) => {
      if (name === "taskDescription") setDescription(value?.taskDescription ?? "");
    });
    return () => sub.unsubscribe();
  }, [watch]);

  // prefill edit
  useEffect(() => {
    if (mode !== "edit" || !taskData) return;

    setTitle(taskData.taskName || "");
    const incoming = taskData.taskDescription ?? "";
    setDescription(incoming);
    setValue("taskDescription", incoming, { shouldDirty: false, keepValues: false });

    setStatus(taskData.status || defaultStatus || "Todo");
    setPriority(taskData.priorityLevel || "medium");

    // map by id against normalized members so pickers display names and avatars
    const assigneeId = Array.isArray(taskData.assignee) && taskData.assignee[0];
    if (assigneeId) {
      const found = normalizedMembers.find(u => String(u?._id) === String(assigneeId));
      setTeamAssignee(
        found
          ? { _id: found._id, firstName: found.firstName, profileImage: found.profilePicture || found.profileImage }
          : { _id: assigneeId }
      );
    } else {
      setTeamAssignee(null);
    }

    const reporterId = Array.isArray(taskData.reporter) && taskData.reporter[0];
    if (reporterId) {
      const foundR = normalizedMembers.find(u => String(u?._id) === String(reporterId));
      setTeamReporter(
        foundR
          ? [{ _id: foundR._id, firstName: foundR.firstName, profileImage: foundR.profilePicture || foundR.profileImage }]
          : [{ _id: reporterId }]
      );
    } else {
      setTeamReporter([]);
    }

    setSubtasks(
      Array.isArray(taskData.subtasks)
        ? taskData.subtasks.map(s => ({
            subtaskName: s.subtaskName || "",
            subTaskDescription: s.subTaskDescription || "",
            isCompleted: !!s.isCompleted,
          }))
        : []
    );

    const existing = Array.isArray(taskData.attachments)
      ? taskData.attachments.map(a => ({
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileType: a.fileType,
          fileSize: a.fileSize,
          uploadedBy: a.uploadedBy,
          uploadedAt: a.uploadedAt,
        }))
      : [];
    setFileUrls(existing);
  }, [mode, taskData, defaultStatus, setValue, normalizedMembers]);

  useEffect(() => {
    if (mode === "create") {
      reset({ taskDescription: "" });
      setDescription("");
    }
  }, [mode, reset]);

  const watchedDesc = watch("taskDescription") || "";
  const editorKey = `${mode}-${taskId ?? "new"}-${watchedDesc.length}`;

  const busy =
    createTask.isPending ||
    updateTask.isPending ||
    bulkUpload.isPending ||
    updateTaskFiles.isPending ||
    isTaskLoading;

  const disabled = useMemo(() => {
    const blocking = busy;
    return !title || !status || !priority || !teamAssignee || !teamReporter.length || blocking;
  }, [title, status, priority, teamAssignee, teamReporter, busy]);

  const addSubtaskRow = () =>
    setSubtasks(p => [...p, { subtaskName: "", subTaskDescription: "", isCompleted: false }]);
  const updateSubtask = (i, k, v) =>
    setSubtasks(p => p.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
  const removeSubtask = i => setSubtasks(p => p.filter((_, idx) => idx !== i));

  const dedupeByNameSize = arr => {
    const seen = new Set();
    const out = [];
    for (const f of arr) {
      const n = f?.name || f?.fileName;
      const s = f?.size || f?.fileSize || 0;
      const key = `${n}-${s}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(f);
      }
    }
    return out;
  };

  const handleAiDescribeOrImprove = useCallback(async () => {
    const titleValue = (title || "").trim();
    const descriptionValue = (getValues("taskDescription") || "").trim();
    if (!titleValue) {
      toast?.error?.("Please add a title first");
      return;
    }
    try {
      setAiThinking(true);
      if (!descriptionValue) {
        const res = await autoDescribeAsync({ title: titleValue });
        const ai =
          res?.description ||
          res?.data?.description ||
          res?.result?.description ||
          res?.text ||
          res?.content ||
          "";
        if (!ai) {
          toast?.error?.("AI did not return a description");
          return;
        }
        setValue("taskDescription", ai, { shouldValidate: true, shouldDirty: true });
        setDescription(ai);
        toast?.success?.("Description generated");
      } else {
        const res = await improveAsync({ title: titleValue, description: descriptionValue });
        const ai =
          res?.description ||
          res?.data?.description ||
          res?.result?.description ||
          res?.text ||
          res?.content ||
          "";
        if (!ai) {
          toast?.error?.("AI did not return an improved description");
          return;
        }
        setValue("taskDescription", ai, { shouldValidate: true, shouldDirty: true });
        setDescription(ai);
        toast?.success?.("Description improved");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Something went wrong";
      toast?.error?.(msg);
    } finally {
      setAiThinking(false);
    }
  }, [title, getValues, setValue, autoDescribeAsync, improveAsync]);

  async function handleSubmit(e) {
    e.preventDefault();

    const currentDescription = getValues("taskDescription") ?? "";
    if (!title || !status || !priority || !teamAssignee || !teamReporter.length) {
      setShowError(true);
      return;
    }
    setShowError(false);

    if (mode === "create") {
      const payload = {
        projectId,
        boardId,
        taskName: title,
        taskDescription: currentDescription,
        subtasks: (subtasks || []).map(s => ({
          subtaskName: s.subtaskName || "",
          subTaskDescription: s.subTaskDescription || "",
          isCompleted: !!s.isCompleted,
        })),
        status,
        assigneeIds: teamAssignee?._id ? [teamAssignee._id] : [],
        reporterIds: teamReporter.map(u => u?._id).filter(Boolean),
        priorityLevel: priority,
        fileUrls: [],
      };

      const res = await createTask.mutateAsync(payload);
      const newTaskId = res?.taskId;

      if (newTaskId) {
        const localFiles = (fileUrls || [])
          .map(f => f?.file || f)
          .filter(x => x && x instanceof File);

        if (localFiles.length) {
          const fd = new FormData();
          for (const f of dedupeByNameSize(localFiles)) {
            fd.append("files", f);
          }
          const up = await bulkUpload.mutateAsync({
            workspaceId,
            projectId,
            boardId,
            taskId: newTaskId,
            formData: fd,
          });

          const saved = up?.files || [];
          const hosted = saved.map(s => ({
            fileUrl: s.fileUrl,
            fileName: s.fileName,
            fileType: s.fileType,
            fileSize: s.fileSize,
            isValidUrl: true,
          }));

          if (hosted.length) {
            await updateTaskFiles.mutateAsync({
              workspaceId,
              projectId,
              boardId,
              taskId: newTaskId,
              fileUrls: hosted,
            });
          }
        }
      }
      refetch?.();
    } else {
      const existingHosted = (fileUrls || [])
        .filter(f => !f.file)
        .map(f => ({
          fileUrl: f.fileUrl,
          fileName: f.fileName,
          fileType: f.fileType,
          fileSize: f.fileSize,
          isValidUrl: true,
        }));

      const newLocal = (fileUrls || [])
        .map(f => (f?.file ? f.file : null))
        .filter(Boolean);

      let hostedNew = [];
      if (newLocal.length) {
        const fd = new FormData();
        for (const f of dedupeByNameSize(newLocal)) {
          fd.append("files", f);
        }
        const up = await bulkUpload.mutateAsync({
          workspaceId,
          projectId,
          boardId,
          taskId,
          formData: fd,
        });
        const saved = up?.files || [];
        hostedNew = saved.map(s => ({
          fileUrl: s.fileUrl,
          fileName: s.fileName,
          fileType: s.fileType,
          fileSize: s.fileSize,
          isValidUrl: true,
        }));
      }

      const finalFiles = [...existingHosted, ...hostedNew];

      const keptNames = new Set(finalFiles.map(f => String(f.fileName)));
      const removed = (taskData?.attachments || []).filter(f => !keptNames.has(String(f.fileName)));
      for (const rf of removed) {
        try {
          await deleteTaskFile.mutateAsync({
            workspaceId,
            projectId,
            boardId,
            taskId,
            fileName: rf.fileName,
          });
        } catch {
          // ignore
        }
      }

      const payload = {
        projectId,
        boardId,
        taskId,
        taskName: title,
        taskDescription: currentDescription,
        subtasks: (subtasks || []).map(s => ({
          subtaskName: s.subtaskName || "",
          subTaskDescription: s.subTaskDescription || "",
          isCompleted: !!s.isCompleted,
        })),
        status,
        assigneeIds: teamAssignee?._id ? [teamAssignee._id] : [],
        reporterIds: teamReporter.map(u => u?._id).filter(Boolean),
        priorityLevel: priority,
        fileUrls: finalFiles,
      };

      await updateTask.mutateAsync(payload);
      await updateTaskFiles.mutateAsync({
        workspaceId,
        projectId,
        boardId,
        taskId,
        fileUrls: finalFiles,
      });
    }

    onClose?.();
    if (mode === "create") {
      setTitle("");
      setDescription("");
      reset({ taskDescription: "" });
      setSubtasks([]);
      setFileUrls([]);
      setTeamAssignee(null);
      setTeamReporter([]);
      setPriority("medium");
      setStatus(defaultStatus || "Todo");
    }
    setTimeout(() => refetch?.(), 0);
  }

  useEffect(() => {
    if (!setFooter) return;
    setFooter(
      <div className="flex justify-end gap-2 w-full">
        <button
          type="button"
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-slate-100"
          onClick={() => {
            onClose?.();
            setTimeout(() => refetch?.(), 0);
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={disabled}
          className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
        >
          {busy ? "Saving..." : mode === "edit" ? "Save changes" : "Create"}
        </button>
      </div>
    );
  }, [setFooter, disabled, busy, mode, onClose, refetch]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4">
      <div className="mb-4">
        <label className="block mb-1 text-slate-700 dark:text-slate-200">Title</label>
        <input
          placeholder="Task title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-[#27272a] dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500"
          required
        />
        {showError && !title && <p className="text-red-500 mt-1">Title is required</p>}
      </div>

      <div className="mb-4">
        <div className="relative">
          <label className="block mb-1 text-slate-700 dark:text-slate-200 pr-28">Description</label>
          <button
            type="button"
            onClick={handleAiDescribeOrImprove}
            disabled={aiBusy}
            aria-busy={aiBusy}
            className="absolute top-0 right-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/60 text-white hover:bg-black/70 disabled:opacity-50"
            title={(getValues("taskDescription") || "").trim() ? "Improve with AI" : "AI write auto"}
          >
            {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{aiBusy ? "Working..." : ((getValues("taskDescription") || "").trim() ? "Improve with AI" : "AI write auto")}</span>
          </button>
        </div>

        <Controller
          name="taskDescription"
          control={control}
          render={({ field: { value, onChange } }) => (
            <QuillEditor
              key={editorKey}
              value={value ?? ""}
              onChange={html => {
                onChange(html);
                setDescription(html);
              }}
            />
          )}
        />
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between">
          <label className="block mb-1 text-slate-700 dark:text-slate-200">Subtasks</label>
          <button type="button" onClick={addSubtaskRow} className="text-indigo-600 hover:text-indigo-700 font-medium">
            + Add Subtask
          </button>
        </div>
        <div className="grid gap-2">
          {subtasks.map((s, i) => (
            <div key={i} className="grid gap-2 border rounded-lg p-2 border-slate-200 dark:border-zinc-700">
              <input
                className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
                placeholder="Subtask name"
                value={s.subtaskName}
                onChange={e => updateSubtask(i, "subtaskName", e.target.value)}
              />
              <textarea
                className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
                placeholder="Subtask description"
                value={s.subTaskDescription}
                onChange={e => updateSubtask(i, "subTaskDescription", e.target.value)}
                rows={2}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!s.isCompleted}
                    onChange={e => updateSubtask(i, "isCompleted", e.target.checked)}
                  />
                  Completed
                </label>
                <button type="button" onClick={() => removeSubtask(i)} className="text-red-500 hover:text-red-600">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <StatusDropdown status={status} setStatus={setStatus} showError={showError} />
        <PriorityDropdown priority={priority} setPriority={setPriority} showError={showError} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <MemberPicker
          label="Assignee"
          members={normalizedMembers}
          multiple={false}
          value={teamAssignee}
          onChange={setTeamAssignee}
          placeholder="Select assignee"
        />
        <MemberPicker
          label="Reporter"
          members={normalizedMembers}
          multiple={false}
          value={teamReporter[0] || null}
          onChange={u => setTeamReporter(u ? [u] : [])}
          placeholder="Select reporter"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-slate-700 dark:text-slate-200">Attachments</label>
        <FileUploader fileUrls={fileUrls} setFileUrls={setFileUrls} isEditMode={mode === "edit"} taskId={taskId} />
      </div>

      {showError && (
        <div className="text-red-500">
          Please fill title status priority assignee and reporter
        </div>
      )}
    </form>
  );
}


































// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import { UseCreateTask, UseUpdateTask, UseGetTaskById } from "../../../hooks/useTaskService";
// import { useBulkUploadTaskFiles, useUpdateTaskFiles, useDeleteTaskFile } from "../../../hooks/useTaskFileService";
// import FileUploader from "../FileUploader";
// import MemberPicker from "../../task/dropdown/MemberPicker";
// import StatusDropdown from "../../task/dropdown/StatusDropdown";
// import PriorityDropdown from "../../task/dropdown/PriorityDropdown";
// import QuillEditor from "../../form/QuillEditor/QuillEditor";
// import { useForm, Controller } from "react-hook-form";
// import { Sparkles, Loader2 } from "lucide-react";
// import { toast } from "sonner";
// import { UseAutoDescribeTask, UseImproveTask } from "../../../hooks/useAiPlannerService";

// // mode: "create" | "edit"
// // taskId: required when mode === "edit"
// export default function AddNewTaskModalManuall({
//   open,
//   onClose,
//   mode = "create",
//   taskId,
//   boardId,
//   defaultStatus,
//   currentBoard,
//   workspaceId,
//   projectId,
//   refetch,
// }) {
//   const shellRef = useRef(null);
//   const editorRef = useRef(null);

//   const createTask = UseCreateTask();
//   const updateTask = UseUpdateTask();
//   const bulkUpload = useBulkUploadTaskFiles();
//   const updateTaskFiles = useUpdateTaskFiles();
//   const deleteTaskFile = useDeleteTaskFile();

//   const { data: taskData, isFetching: isTaskLoading } = UseGetTaskById(
//     mode === "edit" ? { taskId, projectId } : {}
//   );

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
//   const { mutateAsync: autoDescribeAsync, isPending: isAutoDescribing } = UseAutoDescribeTask();
//   const { mutateAsync: improveAsync, isPending: isImproving } = UseImproveTask();

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

//   // prefill everything in edit mode without changing UI
//   useEffect(() => {
//     if (mode !== "edit" || !taskData) return;

//     setTitle(taskData.taskName || "");

//     const incoming = taskData.taskDescription ?? "";
//     setDescription(incoming);
//     setValue("taskDescription", incoming, { shouldDirty: false, keepValues: false });

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

//   const watchedDesc = watch("taskDescription") || "";
//   const editorKey = `${mode}-${taskId ?? "new"}-${watchedDesc.length}`;

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
//     const titleValue = (title || "").trim();
//     const descriptionValue = (getValues("taskDescription") || "").trim();
//     if (!titleValue) {
//       toast?.error?.("Please add a title first");
//       return;
//     }
//     try {
//       setAiThinking(true);

//       if (!descriptionValue) {
//         const res = await autoDescribeAsync({ title: titleValue });
//         const ai =
//           res?.description ||
//           res?.data?.description ||
//           res?.result?.description ||
//           res?.text ||
//           res?.content ||
//           "";
//         if (!ai) {
//           toast?.error?.("AI did not return a description");
//           return;
//         }
//         setValue("taskDescription", ai, { shouldValidate: true, shouldDirty: true });
//         setDescription(ai);
//         toast?.success?.("Description generated");
//       } else {
//         const res = await improveAsync({ title: titleValue, description: descriptionValue });
//         const ai =
//           res?.description ||
//           res?.data?.description ||
//           res?.result?.description ||
//           res?.text ||
//           res?.content ||
//           "";
//         if (!ai) {
//           toast?.error?.("AI did not return an improved description");
//           return;
//         }
//         setValue("taskDescription", ai, { shouldValidate: true, shouldDirty: true });
//         setDescription(ai);
//         toast?.success?.("Description improved");
//       }
//     } catch (err) {
//       const msg = err?.response?.data?.message || err?.message || "Something went wrong";
//       toast?.error?.(msg);
//     } finally {
//       setAiThinking(false);
//     }
//   }, [title, getValues, setValue, autoDescribeAsync, improveAsync]);

//   async function handleSubmit(e) {
//     e.preventDefault();

//     const currentDescription = getValues("taskDescription") ?? "";

//     if (!title || !status || !priority || !teamAssignee || !teamReporter.length) {
//       setShowError(true);
//       return;
//     }
//     setShowError(false);

//     if (mode === "create") {
//       const payload = {
//         projectId,
//         boardId,
//         taskName: title,
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
//       refetch?.();
//     } else {
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
//           // ignore
//         }
//       }

//       const payload = {
//         projectId,
//         boardId,
//         taskId,
//         taskName: title,
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
//       <div
//         className="fixed inset-0 bg-black/50 dark:bg-black/60"
//         onClick={() => {
//           onClose?.();
//           setTimeout(() => refetch?.(), 0);
//         }}
//       />
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
//               onClose?.();
//               setTimeout(() => refetch?.(), 0);
//             }}
//             className="rounded-md px-2 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-700 dark:text-slate-100"
//           >
//             Close
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
//           <div className="mb-4">
//             <label className="block mb-1 text-slate-700 dark:text-slate-200">Title</label>
//             <input
//               placeholder="Task title"
//               value={title}
//               onChange={e => setTitle(e.target.value)}
//               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-[#27272a] dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500"
//               required
//             />
//             {showError && !title && <p className="text-red-500 mt-1">Title is required</p>}
//           </div>

//           <div className="mb-4">
//             <div className="relative">
//               <label className="block mb-1 text-slate-700 dark:text-slate-200 pr-28">Description</label>
//               <button
//                 type="button"
//                 onClick={handleAiDescribeOrImprove}
//                 disabled={aiBusy}
//                 aria-busy={aiBusy}
//                 className="absolute top-0 right-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/60 text-white hover:bg-black/70 disabled:opacity-50"
//                 title={(getValues("taskDescription") || "").trim() ? "Improve with AI" : "AI write auto"}
//               >
//                 {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
//                 <span>{aiBusy ? "Working..." : ((getValues("taskDescription") || "").trim() ? "Improve with AI" : "AI write auto")}</span>
//               </button>
//             </div>

//             <Controller
//               name="taskDescription"
//               control={control}
//               render={({ field: { value, onChange } }) => (
//                 <QuillEditor
//                   key={editorKey}
//                   value={value ?? ""}
//                   onChange={(html) => {
//                     onChange(html);
//                     setDescription(html);
//                   }}
//                 />
//               )}
//             />
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

//           {showError && (
//             <div className="text-red-500">Please fill title status priority assignee and reporter</div>
//           )}
//         </form>

//         <div className="sticky bottom-0 z-10 flex justify-end gap-2 px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur">
//           <button
//             type="button"
//             className="px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-slate-100"
//             onClick={() => {
//               onClose?.();
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
