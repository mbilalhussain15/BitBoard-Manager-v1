import React, { useEffect, useMemo, useContext } from "react";
await Promise.resolve(refetchProjects()); // keep same refresh flow as projects list
navigate(`/workspaces/${workspaceId}`, { replace: true });
} else {
const updated = await updateAsync({ boardId: initialData?._id, ...payload });
toast?.success?.("Board updated successfully");
onOpenChange?.(false);
reset();
await Promise.resolve(refetchProjects());
}
} catch (error: any) {
const msg = error?.response?.data?.message || "Something went wrong";
toast?.error?.(msg);
}
};


const isBusy = isSubmitting || createPending || updatePending;
const titleText = mode === "edit" ? "Edit Board" : "Create Board";
const btnText = mode === "edit" ? "Save Changes" : "Create Board";


return (
<ModalShell
isOpen={isOpen}
onClose={() => onOpenChange?.(false)}
title={titleText}
footer={
<Button type="submit" form="board-dialog-form" isLoading={isBusy}>
{btnText}
</Button>
}
>
<form id="board-dialog-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
<InputField label="Board Name" name="boardName" type="text" register={register} errors={errors} placeholder="Board Name" required />


<div className="space-y-2">
<label className="block text-sm font-medium">Columns</label>
<ul className="space-y-2">
{fields.map((item, index) => (
<li key={item.id} className="flex items-center gap-2">
<input
{...register(`columns.${index}.columnName`, { required: true })}
className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5"
placeholder="Column name"
/>
<button type="button" onClick={() => remove(index)} className="px-2 py-1 rounded border">×</button>
</li>
))}
</ul>
<button type="button" onClick={() => append({ columnName: "" })} className="text-sm text-primary">
+ Add New Column
</button>
</div>


<TeamMembersDropdown
workspaceMembers={workspaceMembers || []}
value={membersValue}
onChange={setMembers}
label="Members"
placeholder="Select Members"
/>
</form>
</ModalShell>
);
}