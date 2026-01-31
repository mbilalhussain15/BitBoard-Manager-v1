import React, { useMemo, useContext, useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../../form/Button";
import { InputField } from "../../form/InputField";
import { TextareaInputField } from "../../form/TextareaInputField";
import TeamMembersDropdown from "../../form/dropdown/TeamMembersDropdown";
import StatusSelect from "../../form/dropdown/ProjectStatusSelect";

import { projectSchema } from "../../../lib/schema";
import { UseCreateProject, UseUpdateProject } from "../../../hooks/useProjectService";
import { ProjectStatus } from "../../../types";
import { ProjectContext } from "../../../context/ProjectContext";
import { UseAutoDescribeTask, UseImproveTask } from "../../../hooks/useAiPlannerService"; // CHANGED
import { Loader2, Sparkles } from "lucide-react";


export default function CreateProjectManuall({
  isOpen,
  onOpenChange,
  workspaceId,
  workspaceMembers,
  mode = "create",
  initialData = null,
  setFooter,                // parent se aya setter. child yahan se footer inject karega
}) {
  const navigate = useNavigate();

  const projectCtx = useContext(ProjectContext) ?? {};
  const {
    refetchProjects = () => {},
    setCurrentProject = () => {},
    setProjects = () => {},
  } = projectCtx;

  const {
    mutateAsync: createAsync = async () => {},
    isPending: createPending = false,
  } = (typeof UseCreateProject === "function" && UseCreateProject()) || {};

  const {
    mutateAsync: updateAsync = async () => {},
    isPending: updatePending = false,
  } = (typeof UseUpdateProject === "function" && UseUpdateProject()) || {};

const { mutateAsync: autoDescribeAsync, isPending: isAutoDescribing } = UseAutoDescribeTask();
  const { mutateAsync: improveAsync, isPending: isImproving } = UseImproveTask();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: projectSchema ? zodResolver(projectSchema) : undefined,
    defaultValues: {
      title: "",
      description: "",
      status: "Planning",
      startDate: "",
      dueDate: "",
      members: [],
      tags: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && initialData) {
      reset({
        title: initialData.title || "",
        description: initialData.description || "",
        status: initialData.status || "Planning",
        startDate: initialData.startDate || "",
        dueDate: initialData.dueDate || "",
        members: Array.isArray(initialData.members) ? initialData.members : [],
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(",") : (initialData.tags || ""),
      });
    } else {
      reset({
        title: "",
        description: "",
        status: "Planning",
        startDate: "",
        dueDate: "",
        members: [],
        tags: "",
      });
    }
  }, [isOpen, mode, initialData, reset]);

  const startDate = watch("startDate");
  const dueDate = watch("dueDate");
  const statusValue = watch("status");
  const membersValue = watch("members") || [];

  const titleValue = watch("title");
  const descriptionValue = watch("description");

  const setMembers = (next) =>
    setValue("members", next, { shouldValidate: true, shouldDirty: true });

  const handleNativeDateChange = (name) => (e) => {
    const v = e.target.value;
    if (v) {
      const iso = new Date(v + "T00:00:00").toISOString();
      setValue(name, iso, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue(name, "", { shouldValidate: true, shouldDirty: true });
    }
  };

  const isoToDateInput = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return "";
    }
  };

  const statusOptions = useMemo(() => {
    if (ProjectStatus && typeof ProjectStatus === "object") {
      return Object.values(ProjectStatus);
    }
    return ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
  }, []);

  const sortByCreatedDesc = (a, b) =>
    new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime();


   const [aiThinking, setAiThinking] = useState(false);
    const aiBusy = aiThinking || isAutoDescribing || isImproving;

  const handleAiDescribeOrImprove = useCallback(async () => {
    if (!titleValue || !titleValue.trim()) {
      toast?.error?.("Please add a title first");
      return;
    }
    try {
      setAiThinking(true);

      // agar description empty hai to autoDescribe, warna improve
      if (!descriptionValue || !String(descriptionValue).trim()) {
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
        setValue("description", ai, { shouldValidate: true, shouldDirty: true });
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
        setValue("description", ai, { shouldValidate: true, shouldDirty: true });
        toast?.success?.("Description improved");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Something went wrong";
      toast?.error?.(msg);
    } finally {
      setAiThinking(false);
    }
  }, [titleValue, descriptionValue, autoDescribeAsync, improveAsync, setValue]);



  const onSubmit = async (values) => {
    const isCreate = mode === "create";
    try {
      if (isCreate) {
        if (!workspaceId) return;
        const payload = {
          ...values,
          tags: Array.isArray(values.tags) ? values.tags.join(",") : (values.tags ?? ""),
        };
        const created = await createAsync({ workspaceId, ...payload });
        setProjects?.((prev) => [...(Array.isArray(prev) ? prev : []), created].sort(sortByCreatedDesc));
        setCurrentProject?.(created);
        toast?.success?.("Project created successfully");
        onOpenChange?.(false);
        reset();
        await Promise.resolve(refetchProjects());
        navigate(`/workspaces/${workspaceId}/projects`, { replace: true });
      } else {
        if (!initialData?._id) return;
        const payload = {
          ...values,
          tags: Array.isArray(values.tags) ? values.tags : String(values.tags || ""),
        };
        const updated = await updateAsync({ projectId: initialData._id, ...payload });
        toast?.success?.("Project updated successfully");
        onOpenChange?.(false);
        reset();
        await Promise.resolve(refetchProjects());
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Something went wrong";
      toast?.error?.(msg);
    }
  };

  const isBusy = isSubmitting || createPending || updatePending;
  const formId = "create-project-form";

  useEffect(() => {
    if (!setFooter) return;
    const btnText = mode === "edit" ? "Save Changes" : "Create Project";
    setFooter(
      <Button type="submit" form={formId} isLoading={isBusy}>
        {btnText}
      </Button>
    );
  }, [setFooter, isBusy, mode]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <InputField
        label="Project Title"
        name="title"
        type="text"
        register={register}
        errors={errors}
        placeholder="Project Title"
        required
      />


      <div className="relative">
        <label htmlFor="description" className="block text-sm font-medium">
          Project Description
        </label>

        <button
          type="button"
          onClick={handleAiDescribeOrImprove}
          disabled={aiBusy}
          className="absolute top-0 right-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/60 text-white hover:bg-black/70 disabled:opacity-50"
          title={!descriptionValue ? "AI write auto" : "Improve with AI"}
        >
          {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          <span>{aiBusy ? "Working..." : !descriptionValue ? "AI write auto" : "Improve with AI"}</span>
        </button>

        <div className="mt-1">
          <TextareaInputField
            label=""               // label upar de diya
            name="description"
            register={register}
            errors={errors}
            placeholder="Write project description"
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Project Status</label>
        <StatusSelect
          value={statusValue}
          options={statusOptions}
          onChange={(v) => setValue("status", v, { shouldValidate: true, shouldDirty: true })}
        />
        {errors?.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Start Date</label>
          <input
            type="date"
            className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5"
            value={isoToDateInput(startDate)}
            onChange={handleNativeDateChange("startDate")}
          />
          {errors?.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Due Date</label>
          <input
            type="date"
            className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5"
            value={isoToDateInput(dueDate)}
            onChange={handleNativeDateChange("dueDate")}
          />
          {errors?.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>}
        </div>
      </div>

      <InputField
        label="Tags"
        name="tags"
        type="text"
        register={register}
        errors={errors}
        placeholder="comma,separated,tags"
      />

      <TeamMembersDropdown
        workspaceMembers={workspaceMembers || []}
        value={membersValue}
        onChange={setMembers}
        label="Members"
        placeholder="Select Members"
      />
    </form>
  );
}
