import { WorkspaceAvatar } from "../workspace/workspace-avatar";
import { Button } from "../form/Button";
import { MoreVertical, Plus, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../form/avatar";
import { useState } from "react";


export const ProjectHeader = ({
  workspace,
  members,
  onCreateProject,
  onInviteMember,
}) => {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        {/* <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-center gap-3 bg-amber-400">
          <div className="flex md:items-center gap-3">
            {workspace.WorkspaceColor && (
              <WorkspaceAvatar color={workspace.WorkspaceColor} name={workspace.WorkspaceName} />
            )}

            <h2 className="text-xl md:text-2xl font-semibold">
              {workspace.WorkspaceName}
            </h2>
          </div>

          <div className="flex items-center gap-3 justify-between md:justify-start mb-4 md:mb-0">
            <Button variant={"outline"} onClick={onInviteMember}>
              <UserPlus className="mr-2" />
              Invite
            </Button>
            <Button onClick={onCreateProject}>
              <Plus className=" mr-2" />
              Create Project
            </Button>
          </div>
        </div> */}
  


<div className="flex items-center justify-between gap-3  px-4 py-2 rounded-lg min-h-[56px] ">
  {/* LEFT */}
  <div className="flex items-center gap-3 min-w-0 grow">
    {workspace.WorkspaceColor && (
      <WorkspaceAvatar
        color={workspace.WorkspaceColor}
        name={workspace.WorkspaceName}
        className="h-8 w-8"
      />
    )}
    <h2 className="text-xl md:text-2xl font-semibold truncate leading-none text-black dark:text-white">
      {workspace.WorkspaceName}
    </h2>
  </div>

  {/* RIGHT — desktop buttons */}
  <div className="hidden sm:flex items-center gap-3 shrink-0 h-10">
    <Button
      variant="outline"
      onClick={onInviteMember}
      className="h-10 px-3 py-0 w-auto inline-flex items-center leading-none whitespace-nowrap mt-0"
    >
      <UserPlus className="mr-2 h-5 w-5" />
      Invite
    </Button>

    <Button
      onClick={onCreateProject}
      className="h-10 px-3 py-0 w-auto inline-flex items-center leading-none whitespace-nowrap mt-0"
    >
      <Plus className="mr-2 h-5 w-5" />
      Create Project
    </Button>
  </div>

  {/* RIGHT — mobile kebab */}
  <KebabActions
    onInvite={onInviteMember}
    onCreate={onCreateProject}
    className="sm:hidden"
  />
</div>





        {/* {workspace.WorkspaceDescription && (
          <p className="text-sm md:text-base text-muted-foreground">
            {workspace.WorkspaceDescription}
          </p>
        )} */}
      </div>

      {members.length > 0 && (
        <div className="flex items-center gap-2 sm:hidden">
          <span className="text-sm text-muted-foreground">Members</span>

          <div className="flex -space-x-2">
            {members.map((member) => (
              <Avatar
                key={member._id}
                className="relative h-8 w-8 rounded-full  border-2 border-background overflow-hidden"
                title={member.user.name}
              >
                <AvatarImage
                  src={member.user.profilePicture}
                  alt={member.user.name}
                />
                <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function KebabActions({ onInvite, onCreate, className = "" }) {
  const [open, setOpen] = useState(false);
  const kill = (e) => { e.preventDefault?.(); e.stopPropagation?.(); };

  return (
    <div className={`relative shrink-0 h-10 ${className}`}>
      <button
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        className="h-10 w-10 inline-flex items-center justify-center rounded-md
                   text-neutral-700 hover:bg-black/10
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                   dark:text-neutral-200 dark:hover:bg-white/10"
        onClick={(e) => { kill(e); setOpen((v) => !v); }}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)} onClick={() => setOpen(false)} />
          <div
            role="menu"
            aria-orientation="vertical"
            // 👇 exactly under the button
            className="absolute right-0 top-full mt-0 z-50 w-48 rounded-xl p-1
                       origin-top-right
                       bg-white text-neutral-800 shadow-lg ring-1 ring-black/5 border border-neutral-200
                       dark:bg-neutral-800 dark:text-neutral-100 dark:ring-white/10 dark:border-neutral-700"
            onClick={kill}
          >
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm rounded-md inline-flex items-center gap-2
                         hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                         dark:hover:bg-neutral-700"
              onClick={() => { setOpen(false); onInvite?.(); }}
            >
              <UserPlus className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              Invite
            </button>

            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm rounded-md inline-flex items-center gap-2
                         hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                         dark:hover:bg-neutral-700"
              onClick={() => { setOpen(false); onCreate?.(); }}
            >
              <Plus className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              Create Project
            </button>
          </div>
        </>
      )}
    </div>
  );
}
