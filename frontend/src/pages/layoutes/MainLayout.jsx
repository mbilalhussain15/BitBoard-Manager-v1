import { useState, useEffect } from "react";
import { Loader } from "../../components/loader/dotLoader";
import { useAuth } from "../../provider/auth-context";
import NavBar from "../../components/layout/navBar";
import { mockWorkspaceAPI } from "../../mock/mockWorkspaces";
import clsx from "clsx";
import CreateWorkspace from "../../components/workspace/create-workspace";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useContext } from "react";
import { WorkspaceContext } from "../../context/WorkspaceContext";



export default function MainLayout() {

    const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    loading: workspaceLoading,
  } = useContext(WorkspaceContext);

    const { isAuthenticated, isLoading } = useAuth();
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
    // const [currentWorkspace, setCurrentWorkspace] = useState(null);
    // const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(true); 
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // useEffect(() => {
    //     // Simulate fetching workspaces from API
    //     const fetchWorkspaces = async () => {
    //     try {
    //         setLoading(true);
    //         // In a real app, you would fetch from your API
    //         const response = await mockWorkspaceAPI.getWorkspaces();
    //         setWorkspaces(response.data);
    //         if (response.data.length > 0) {
    //         setCurrentWorkspace(response.data[0]);
    //         }
    //     } catch (error) {
    //         console.error("Error fetching workspaces:", error);
    //     } finally {
    //         setLoading(false);
    //     }
    //     };

    //     fetchWorkspaces();
    // }, []);

    useEffect(() => {
        setLoading(true);
        const delay = setTimeout(() => {
        setLoading(false);
        }, 500);
        return () => clearTimeout(delay);
    }, [location]);


    if (!isAuthenticated) {
        // return <Navigate to="/sign-in" />;
        return null;
    }

    const handleWorkspaceSelected = (workspace) => {
        setCurrentWorkspace(workspace);
    };
  return (
   <>
        {(workspaceLoading  || isLoading)  && (
        <div className='fixed inset-0 z-50 flex justify-center items-center backdrop-blur-sm bg-black/30 dark:bg-white/10'>
            <Loader />
        </div>
        )}
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-[#1b1b1b]">
            <NavBar
                workspaces={workspaces}
                selectedWorkspace={currentWorkspace}
                onWorkspaceSelect={handleWorkspaceSelected}
                onCreateWorkspace={() => setIsCreatingWorkspace(true)} 
                currentWorkspace={currentWorkspace}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isUserMenuOpen={isUserMenuOpen}
                setIsUserMenuOpen={setIsUserMenuOpen}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />
        
        <div className="flex flex-1 overflow-hidden">
            
            <main className={clsx("flex-1 overflow-y-auto pt-14 sm:pt-14  bg-gray-100 dark:bg-[#1b1b1b]",

            // Desktop - adjust with sidebar
            isCollapsed ? "2xl:ml-20 xl:ml-20 lg:ml-20 md:ml-20 sm:ml-20" : "2xl:ml-64 xl:ml-64 lg:ml-64 md:ml-64 sm:ml-64",
            // Transition
            "transition-all duration-300 ease-in-out"

            )}>
        
            <div className="h-full p-4 md:p-6 lg:p-8">
                <Outlet context={{ currentWorkspace }}/>
            </div>
            </main>
        </div>

        
        <CreateWorkspace
            isCreatingWorkspace={isCreatingWorkspace}
            setIsCreatingWorkspace={setIsCreatingWorkspace}
        />
        </div>


   </>
  );
}
