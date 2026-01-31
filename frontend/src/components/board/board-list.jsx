import { NoDataFound } from "../no-data-found"
import { BoardCard } from "./board-card"

import { Avatar, AvatarFallback, AvatarImage } from "../form/avatar"

export const BoardList = ({ projectId,workspaceId, boards, onCreateBoard, workspaceMembers = []  }) => {
  
  return (
    <div>
      {/* <h3 className="text-xl font-medium mb-4">Projects</h3> */}

     <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Left (but left-aligned next to members): Projects */}
        <h3 className="text-xl font-medium text-black dark:text-white">Boards</h3>
        {/* Right: Members (ab hide nahi, dono screens pe dikhega) */}
        {workspaceMembers?.length > 0 && (
          <div className="hidden sm:flex items-center gap-2  sm:ml-20">
            <span className="text-sm text-muted-foreground text-black dark:text-white">Members</span>
            <div className="flex -space-x-2">
              {workspaceMembers.map((m) => (
                <Avatar
                  key={m._id}
                  className="h-7 w-7 ring-2 ring-background"
                  title={m.user?.name}
                >
                  <AvatarImage src={m.user?.profilePicture} alt={m.user?.name} />
                  <AvatarFallback>{m.user?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}

  
</div>


      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {boards.length === 0 ? (
          <NoDataFound
            title="No board found"
            description="Create a board to get started"
            buttonText="Create Board"
            buttonAction={onCreateBoard}
          />
        ) : (
          boards.map(board => {
            const boardProgress = 0

            return (
              <BoardCard
                key={board._id}
                board={board}
                progress={boardProgress}
                projectId={projectId}
                workspaceId={workspaceId}
                workspaceMembers={workspaceMembers}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
