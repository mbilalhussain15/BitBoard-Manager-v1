import { Loader } from "../../components/loader/dotLoader";
import { NoDataFound } from "../../components/no-data-found";
import { Button } from "../../components/form/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/form/card";
import CreateWorkspace from "../../components/workspace/create-workspace";
import { WorkspaceAvatar } from "../../components/workspace/workspace-avatar";
import { useGetWorkspacesQuery } from "../../hooks/useWorkspace";
import { PlusCircle, Users } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { format } from "date-fns";
import SimplePopup from "../../modals/workspace/SimplePopup";
import { useIsClamped } from "../../hooks/useIsClamped";

const Workspaces = () => {
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const { data: workspaces, isLoading } = useGetWorkspacesQuery();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <div className="space-y-8 h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">Workspaces</h2>

          <Button onClick={() => setIsCreatingWorkspace(true)} 
          className="ml-auto mt-0 mr-2 inline-flex !w-auto shrink-0 items-center gap-2 px-4 py-2 whitespace-nowrap">
            <PlusCircle className=" mr-2" />
            New Workspace
          </Button>
        </div>

        <div className="bg-[#ececec] dark:bg-[#282828] rounded-lg p-4 md:p-6 shadow-md flex-1 overflow-auto">

          {/* <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"> */}
          <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <WorkspaceCard key={ws._id} workspace={ws} />
            ))}

            {workspaces.length === 0 && (
              <NoDataFound
                title="No workspaces found"
                description="Create a new workspace to get started"
                buttonText="Create Workspace"
                buttonAction={() => setIsCreatingWorkspace(true)}
              />
            )}
          </div>
        </div>
      </div>

      <CreateWorkspace
        isCreatingWorkspace={isCreatingWorkspace}
        setIsCreatingWorkspace={setIsCreatingWorkspace}
      />
    </>
  );
};

const WorkspaceCard = ({ workspace }) => {
  const [open, setOpen] = useState(false)
  const hasDesc = !!(workspace.WorkspaceDescription && workspace.WorkspaceDescription.trim())

  const pRef = useRef(null)
  const isClamped = useIsClamped(pRef, [workspace.WorkspaceDescription])

  return (
    <Link to={`/workspaces/${workspace._id}/projects`}>
      <Card className="h-full min-h-[220px] flex flex-col transition-all hover:shadow-md hover:-translate-y-1 hover:shadow-emerald-500 bg-[#e2e2e2] border-[#e2e2e2] dark:bg-[#3c3c3c] dark:border-[#3c3c3c]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">

              <WorkspaceAvatar name={workspace.WorkspaceName} color={workspace.WorkspaceColor} />

              <div>
                <CardTitle>{workspace.WorkspaceName}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  Created at {format(workspace.createdAt, "MMM d, yyyy h:mm a")}
                </span>
              </div>
            </div>

            <div className="flex items-center text-muted-foreground">
              <Users className="size-4 mr-1" />
              <span className="text-xs">{workspace.members.length}</span>
            </div>
          </div>

          <CardDescription
            ref={pRef}
            className="line-clamp-2"
          >
            {hasDesc ? workspace.WorkspaceDescription : "No description"}
            
          </CardDescription>
          
          {hasDesc && isClamped && (
            <div className="mt-2 text-right">
              <button
              
                type="button"
                onClick={(e) =>{
                    e.stopPropagation();
                    e.preventDefault();
                    setOpen(true)
                }}
                className="mt-2 text-xs font-medium text-primary hover:underline items-start cursor-pointer"
              >
                View more
              </button>
          </div>
        )}

        <SimplePopup
          open={open}
          text={workspace.WorkspaceDescription}
          onClose={() => setOpen(false)}
          title={`${workspace.WorkspaceName} — Description`}
        />
        </CardHeader>

        <CardContent className="mt-auto">
          <div className="text-sm text-muted-foreground">
            View workspace details and projects
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default Workspaces;