import { NoDataFound } from "../no-data-found"
import { ProjectCard } from "./project-card"

import { Avatar, AvatarFallback, AvatarImage } from "../form/avatar"

export const ProjectList = ({ workspaceId, projects, onCreateProject, workspaceMembers = []  }) => {
  
  return (
    <div>
      {/* <h3 className="text-xl font-medium mb-4">Projects</h3> */}

     <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Left (but left-aligned next to members): Projects */}
        <h3 className="text-xl font-medium text-black dark:text-white">Projects</h3>
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
        {projects.length === 0 ? (
          <NoDataFound
            title="No projects found"
            description="Create a project to get started"
            buttonText="Create Project"
            buttonAction={onCreateProject}
          />
        ) : (
          projects.map(project => {
            const projectProgress = 0

            return (
              <ProjectCard
                key={project._id}
                project={project}
                progress={projectProgress}
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
