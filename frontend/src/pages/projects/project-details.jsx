import { Loader } from "../../components/loader/dotLoader";
import { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import { ProjectContext } from "../../context/ProjectContext";
import CreateEditBoardDialog from "../../components/board/create-edit-board";
import { BoardHeader } from "../../components/board/board-header";
import { BoardList } from "../../components/board/board-list";
import { BoardContext } from "../../context/BoardContext";
import { useGetProjectQuery } from "../../hooks/useProjectService";

const ProjectDetails = () => {
  const { workspaceId, projectId } = useParams();
  const [isCreateBoard, setIsCreateBoard] = useState(false);

  const { data, isLoading } = useGetProjectQuery(projectId);
  // ✅ BoardContext exposes `boards`, not `board`
  // const { boards: ctxBoards } = useContext(BoardContext) || {};
  const { boards: ctxBoards } = useContext(BoardContext) || {};
    // safe fallbacks
  const boards = Array.isArray(data?.boards) ? data.boards : (ctxBoards || []);
  const project = data?.project || {};
  // const boards = (Array.isArray(ctxBoards) && ctxBoards.length ? ctxBoards : (data?.boards || []));
  const projectMembers = project?.members || [];

  if (!workspaceId) return <div>No workspace found</div>;
  if (!projectId) return <div>No project found</div>;
  if (isLoading) return <Loader />;


  return (
    <div className="space-y-2 h-full flex flex-col">
      {/* ✅ ProjectHeader ko project + members do */}
      <BoardHeader
        project={project}
        members={projectMembers}
        onCreateBoard={() => setIsCreateBoard(true)}
        onInviteMember={() => {/* open invite modal if you have one */}}
      />

      <div className="bg-[#ececec] dark:bg-[#282828] rounded-lg p-4 md:p-6 shadow-md flex-1 overflow-auto">
        {/* ✅ prop names: boards + onCreateBoard */}
        <BoardList
          projectId={projectId}
          workspaceId={workspaceId}
          boards={boards}
          onCreateBoard={() => setIsCreateBoard(true)}
          workspaceMembers={projectMembers}
        />
      </div>

      {/* ✅ board is under project => projectId + projectMembers */}
      <CreateEditBoardDialog
        isOpen={isCreateBoard}
        onOpenChange={setIsCreateBoard}
        mode="create"
        projectId={projectId}
        projectMembers={projectMembers}
      />
    </div>
  );
};

export default ProjectDetails;
