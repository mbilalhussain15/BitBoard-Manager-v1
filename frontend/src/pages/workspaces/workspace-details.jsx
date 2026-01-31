import { Loader } from "../../components/loader/dotLoader"
// import { CreateProjectDialog } from "@/components/project/create-project"
// import { InviteMemberDialog } from "@/components/workspace/invite-member"
// import { ProjectList } from "@/components/workspace/project-list"
import {ProjectHeader} from "../../components/project/project-header"
import { useContext, useState } from "react"
import { useParams } from "react-router-dom"
import { useGetWorkspaceQuery } from "../../hooks/useWorkspace"
import { ProjectList } from "../../components/project/project-list"
import CreateProjectDialog from "../../components/project/create-project"

import { ProjectContext } from "../../context/ProjectContext";  


const WorkspaceDetails = () => {
  const { workspaceId } = useParams()
  const [isCreateProject, setIsCreateProject] = useState(false)
  const [isInviteMember, setIsInviteMember] = useState(false)
    const [open, setOpen] = useState(false);

  const { data, isLoading } = useGetWorkspaceQuery(workspaceId)
  const { projects: ctxProjects } = useContext(ProjectContext) || {};


  console.log(" data=",data);
  if (!workspaceId) {
    return <div>No workspace found</div>
  }

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    )
  }

  const handleCreate = async ({ projectData, workspaceId }) => {
    // mutate({ projectData, workspaceId });
    // or fetch('/api/projects', { method: 'POST', body: JSON.stringify(...) })
    console.log("Create:", projectData, workspaceId);
  };

  return (
    <div className="space-y-2 h-full flex flex-col">
      <ProjectHeader
        workspace={data.workspace}
        members={data?.workspace?.members}
        onCreateProject={() => setIsCreateProject(true)}
        onInviteMember={() => setIsInviteMember(true)}
      />
  
    <div className="bg-[#ececec] dark:bg-[#282828] rounded-lg p-4 md:p-6 shadow-md flex-1 overflow-auto">
        <ProjectList
          workspaceId={workspaceId}
          projects={ (ctxProjects && ctxProjects.length) ? ctxProjects : data.projects }
          onCreateProject={() => setIsCreateProject(true)}
          workspaceMembers={data.workspace.members}
        />


      </div>

      <CreateProjectDialog
        isOpen={isCreateProject}
        onOpenChange={setIsCreateProject}
        workspaceId={workspaceId}
        workspaceMembers={data.workspace.members}
        />



      {/* <CreateProjectDialog
        isOpen={isCreateProject}
        onOpenChange={setIsCreateProject}
        workspaceId={workspaceId}
        workspaceMembers={data.workspace.members}
      /> */}
{/*
      <InviteMemberDialog
        isOpen={isInviteMember}
        onOpenChange={setIsInviteMember}
        workspaceId={workspaceId}
      /> */}
    </div>
  )
}

export default WorkspaceDetails
