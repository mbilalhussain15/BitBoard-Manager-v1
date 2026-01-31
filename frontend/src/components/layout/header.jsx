import { useAuth } from "../../provider/auth-context";
import { Bell, PlusCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";

export const Header = ({
  onWorkspaceSelected,
  selectedWorkspace,
  onCreateWorkspace,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
//   const { workspaces } = useLoaderData();

  // Mock workspaces data
  const workspaces = [
    {
      _id: "1",
      name: "Marketing Team",
      color: "#3B82F6", // blue-500
    },
    {
      _id: "2",
      name: "Development",
      color: "#10B981", // emerald-500
    },
    {
      _id: "3",
      name: "Design",
      color: "#F59E0B", // amber-500
    },
    {
      _id: "4",
      name: "Sales",
      color: "#EF4444", // red-500
    },
  ];

  const isOnWorkspacePage = useLocation().pathname.includes("/workspace");

  const handleOnClick = (workspace) => {
    onWorkspaceSelected(workspace);
    const location = window.location;

    if (isOnWorkspacePage) {
      navigate(`/workspaces/${workspace._id}`);
    } else {
      const basePath = location.pathname;
      navigate(`${basePath}?workspaceId=${workspace._id}`);
    }
  };

  return (
    <div className="bg-white sticky top-0 z-40 border-b">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 border rounded-md hover:bg-gray-50">
            {selectedWorkspace ? (
              <>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedWorkspace.color }}
                >
                  {selectedWorkspace.name.charAt(0)}
                </div>
                <span className="font-medium">{selectedWorkspace.name}</span>
              </>
            ) : (
              <span className="font-medium">Select Workspace</span>
            )}
          </button>

          <div className="absolute left-0 mt-1 w-56 origin-top-left bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block">
            <div className="py-1">
              <div className="px-3 py-2 text-sm font-medium text-gray-700">
                Workspace
              </div>
              <div className="border-t border-gray-100"></div>

              <div className="py-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={() => handleOnClick(ws)}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white mr-2"
                      style={{ backgroundColor: ws.color }}
                    >
                      {ws.name.charAt(0)}
                    </div>
                    <span>{ws.name}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100"></div>
              <button
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                onClick={onCreateWorkspace}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Workspace
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Bell className="w-5 h-5" />
          </button>

          <div className="relative group">
            <button className="rounded-full border p-1 w-8 h-8">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
            </button>

            <div className="absolute right-0 mt-1 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block">
              <div className="py-1">
                <div className="px-3 py-2 text-sm font-medium text-gray-700">
                  My Account
                </div>
                <div className="border-t border-gray-100"></div>
                <Link
                  to="/user/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </Link>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};