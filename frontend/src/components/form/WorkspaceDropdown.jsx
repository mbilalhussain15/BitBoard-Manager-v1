import { FaChevronDown, FaPlus, FaSearch } from "react-icons/fa";
import { useMemo, useState, useRef, useEffect } from "react";

const WorkspaceDropdown = (
  { 
    workspaces, 
    selectedWorkspace, 
    onWorkspaceSelect, 
    onCreateWorkspace 
  }
) => {
 
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tooltip, setTooltip] = useState({ visible: false, text: "", position: null });

  const dropdownRef = useRef(null);
  const textRef = useRef(null);

 const getWorkspaceColor = (nameInput) => {
  const colors = [
    "bg-orange-500 dark:bg-orange-800",
    "bg-blue-500 dark:bg-blue-800",
    "bg-green-500 dark:bg-green-800",
    "bg-purple-500 dark:bg-purple-800",
    "bg-yellow-500 dark:bg-yellow-800",
    "bg-pink-500 dark:bg-pink-800",
    "bg-red-500 dark:bg-red-800",
    "bg-indigo-500 dark:bg-indigo-800",
    "bg-teal-500 dark:bg-teal-800",
    "bg-cyan-500 dark:bg-cyan-800",
    "bg-lime-500 dark:bg-lime-800",
    "bg-rose-500 dark:bg-rose-800",
    "bg-amber-500 dark:bg-amber-800",
    "bg-sky-500 dark:bg-sky-800",
    "bg-fuchsia-500 dark:bg-fuchsia-800",
  ];
  const name = typeof nameInput === "string" ? nameInput.trim() : "";
  if (!name) return colors[0];      // default color
  const code = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return colors[code % colors.length];
};

const getName = (ws) => (ws?.name ?? ws?.WorkspaceName ?? "").trim();

//   // Get color data from hex value
// const color = getColorData("#F472B6"); 
// // Returns pink color object

// // Use in your component
// <div className={`${color.lightClass} dark:${color.darkClass}`} />




  const filteredWorkspaces = useMemo(() => {
  return workspaces.filter(w =>
    getName(w).toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [workspaces, searchTerm]);


  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
    setSearchTerm("");
    setTooltip({ visible: false, text: "", position: null });
  };

  const handleSelect = (workspace) => {
    onWorkspaceSelect(workspace);
    setIsOpen(false);
    setTooltip({ visible: false, text: "", position: null });
  };

  const isTruncated = (el) => el && el.scrollWidth > el.clientWidth;

  const handleMouseEnter = (e, text) => {
    const el = e.currentTarget;
    if (isTruncated(el)) {
      const rect = el.getBoundingClientRect();
      setTooltip({
        visible: true,
        text,
        position: { top: rect.top, left: rect.left, width: rect.width }
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, text: "", position: null });
  };

 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setTooltip({ visible: false, text: "", position: null });
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);


  return (
    <div  ref={dropdownRef} className="relative ml-4 group">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-between px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200
         bg-white dark:bg-[#333333] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50
        dark:hover:bg-[#424242] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
         dark:focus:ring-green-500 dark:focus:border-green-500 w-full"
        // style={{ minWidth: "180px", maxWidth: "200px" }}
      >
        <div className="flex items-center overflow-hidden w-full">
          {selectedWorkspace ? (
            <>
              <div
                className="w-5 h-5 rounded mr-2 flex-shrink-0 flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: selectedWorkspace.WorkspaceColor }}
              >
                {selectedWorkspace.WorkspaceName.charAt(0)}
              </div>
              <span
                ref={textRef}
                className="truncate text-left"
                onMouseEnter={(e) => handleMouseEnter(e, selectedWorkspace.WorkspaceName)}
                onMouseLeave={handleMouseLeave}
                style={{ maxWidth: "100%" }}
              >
                {selectedWorkspace.WorkspaceName}
              </span>
            </>
          ) : (
            <span className="text-gray-400">Select Workspace</span>
          )}
        </div>
        <FaChevronDown
          className={`ml-2 w-3 h-3 flex-shrink-0 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
        />
      </button>

      {tooltip.visible && (
        <div
          className="fixed z-50 px-2 py-1 text-xs text-black bg-gray-200 dark:text-white dark:bg-[#4d4d4d] rounded shadow-lg pointer-events-none"
          style={{
            top: tooltip.position.top + 26,
            left: tooltip.position.left + tooltip.position.width / 2,
            transform: "translateX(-50%)",
            userSelect: "none",
            maxWidth: "220px",
            wordWrap: "break-word",
            textAlign: "center",
          }}
        >
          {tooltip.text}
          <div className="absolute top-0 left-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800 transform -translate-x-1/2 -translate-y-full"></div>
        </div>
      )}

      {isOpen && (
        <div className="absolute left-0 mt-2 z-40 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg bg-white dark:bg-[#333333] rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Select Workspace
            </h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#444444] text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-green-500 dark:focus:border-green-500"
                placeholder="Search workspaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ul className="py-2 overflow-y-auto max-h-60">
            {filteredWorkspaces.length > 0 ? (
              filteredWorkspaces.map((workspace) => (
                <li
                  key={workspace._id}
                  onClick={(e) => {
                    
                    e.stopPropagation();
                    handleSelect(workspace);
                  }}
                  className={`flex items-center px-4 py-2 text-sm cursor-pointer ${
                    selectedWorkspace?._id === workspace._id
                      ? "bg-blue-50 dark:bg-[#037d50]"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded mr-3 flex-shrink-0 flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: workspace.WorkspaceColor }}
                  >
                    {workspace.WorkspaceName.charAt(0)}
                  </div>
                  <span
                    onMouseEnter={(e) => handleMouseEnter(e, workspace.WorkspaceName)}
                    onMouseLeave={handleMouseLeave}
                    className={`truncate ${
                      selectedWorkspace?._id === workspace._id
                        ? "text-indigo-700 dark:text-green-100"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                    style={{ maxWidth: "100%" }}
                  >
                    {workspace.WorkspaceName}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                No workspaces found
              </li>
            )}
          </ul>
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => {
                onCreateWorkspace();
                setIsOpen(false);
                setTooltip({ visible: false, text: "", position: null });
              }}
              className="flex w-full text-left text-sm text-indigo-600 dark:text-green-400 hover:text-indigo-800 dark:hover:text-green-600 items-center cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-green-900 mr-3 flex-shrink-0 flex items-center justify-center">
                <FaPlus className="w-3 h-3" />
              </span>
              <span>Create Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDropdown;