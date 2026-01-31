import React, { useState, useEffect } from 'react';
import SideBar from './sidebar';
import { FaChevronDown, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { MdSettings } from "react-icons/md";

import { useLoaderData, useNavigate } from "react-router";
// import { logout } from "../../redux/slices/authSlice";
// import logo from '../../assets/logo.png'; 
import network from '../../assets/network.png';
import { useAuth } from '../../provider/auth-context';
import WorkspaceDropdown from '../form/WorkspaceDropdown';
import clsx from 'clsx';
import { useContext } from 'react';
import { WorkspaceContext } from '../../context/WorkspaceContext';
import { getInitials } from '../../utils';
import { Avatar, AvatarFallback, AvatarImage } from '../form/avatar';

export default function NavBar({
  workspaces,
  selectedWorkspace,
  onWorkspaceSelect,
  onCreateWorkspace,
  isCollapsed,
  setIsCollapsed,
  isUserMenuOpen,
  setIsUserMenuOpen,
  isSidebarOpen,
  setIsSidebarOpen
}) {

    const navigate = useNavigate();
    const { user: currentUser, logout } = useAuth()
    const [profilePicture, setProfilePicture] = useState(null);
    const name = currentUser?.fullName || currentUser?.name || "User";

  //   const workspaces = [
  //       { id: 1, name: 'My Workspace' },
  //       { id: 2, name: 'We have launched the new Flowbite Dashboard featuring over 60+ pages!' },
  //       { id: 3, name: 'ACMS Team' },
  //       { id: 4, name: 'Community Devs' },
  //       { id: 5, name: 'Codewave' },
  //       { id: 6, name: 'Personal' },
  //       { id: 7, name: 'Soft Team' },
  //       { id: 8, name: 'Devs' },
  //       { id: 9, name: 'BitBoard' },
  //       { id: 10, name: 'hardwae' }

  //   ];
  // const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0] || null);

//   useEffect(() => {
//   if (workspaces.length > 0 && !selectedWorkspace) {
//     setSelectedWorkspace(workspaces[0]);
//   } else if (workspaces.length === 0 && selectedWorkspace) {
//     setSelectedWorkspace(null);
//   }
// }, [workspaces, selectedWorkspace]);

  // ✅ Log user info when NavBar mounts or user changes
  useEffect(() => {
    if (currentUser) {
      // console.log(`✅ Logged in as: ${currentUser.name || currentUser.username}`);
      setProfilePicture(
      currentUser?.profilePicture ||
      currentUser?.avatarUrl ||
      null
    );
    }
  }, [currentUser]);



  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsSidebarOpen(false);
  };

  const handleMenuItemClick = (action) => {
    if (action) action();
    setIsUserMenuOpen(false);
  };

  const userMenuData = [
    {
      label: 'Settings',
      icon: <MdSettings style={{ fontSize: '18px' }} />,
      onClick: () => navigate(`/profilePage`),
    },
    {
      label: 'Sign out',
      icon: <FaSignOutAlt style={{ fontSize: '18px' }} />,
      onClick: () => {
        logout();
        console.log("🚪 User logged out.");
        navigate("/");
      },
    },
    
  ];


  return (
    <>
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsUserMenuOpen(false)}
        ></div>
      )}


      <SideBar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        currentWorkspace={selectedWorkspace}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* <nav className="fixed top-0 left-0 sm:left-64 right-0 z-0 bg-gray-50 dark:bg-[#282828] dark:border-darkNavbar text-gray-700 dark:text-gray-300 border-l border-b border-gray-200 dark:border-[#303030]">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                  />
                </svg>
              </button>

              
              
            </div>
<WorkspaceDropdown 
                  workspaces={workspaces}
                  selectedWorkspace={selectedWorkspace}
                  onWorkspaceSelect={setSelectedWorkspace}
              />
            <div className="flex items-center ms-3">
              <button
                onClick={toggleUserMenu}
                type="button"
                className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
              >
                <span className="sr-only">Open user menu</span>
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="user"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <FaUserCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                )}
              </button>

              {isUserMenuOpen && (
                <div className="absolute top-14 right-4 z-50 w-48 bg-[#282828] rounded-lg shadow-md dark:bg-[#282828]">
                  <ul className="py-2">
                    {userMenuData.map((item, index) => (
                      <li
                        key={index}
                        onClick={() => handleMenuItemClick(item.onClick)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav> */}


    <nav className={clsx("fixed top-0 left-0 right-0 z-30 bg-gray-50 dark:bg-[#282828] dark:border-darkNavbar",
     "text-gray-700 dark:text-gray-300 border-l border-b border-gray-200 dark:border-[#303030]",
     // Mobile behavior (full width)
      "left-0 right-0",
      // Desktop behavior (adjust with sidebar)
      isCollapsed ? "2xl:left-20 xl:left-20 lg:left-20 md:left-20 sm:left-20 " : "2xl:left-64 xl:left-64 lg:left-64 md:left-64 sm:left-64",
      // Transition
      "transition-all duration-300 ease-in-out",
      // Shadow
      "shadow-sm"
        )}>

{/* <nav className={clsx(
  "fixed top-0 z-30 bg-gray-50 dark:bg-[#282828] h-14 w-full",
  "flex items-center justify-between px-4",
  "border-b border-gray-200 dark:border-[#303030]",
  // Mobile behavior (full width)
  "left-0 right-0",
  // Desktop behavior (adjust with sidebar)
  isCollapsed ? "md:left-20" : "md:left-64",
  // Transition
  "transition-all duration-300 ease-in-out",
  // Shadow
  "shadow-sm"
)}> */}




{/* <nav className={clsx(
  "fixed top-0 z-30 bg-gray-50 dark:bg-[#282828] h-14 w-full", // Keep fixed height
  "flex items-center justify-between px-4",
  "border-b border-gray-200 dark:border-[#303030]",
  // Desktop positioning
  isCollapsed ? "md:pl-20" : "md:pl-64",
  "transition-all duration-300 ease-in-out",
  // Ensure navbar stays on top
  "shadow-sm" // Optional: add slight shadow for depth
)}> */}
{/* <nav className={clsx(
      "fixed top-0 z-30 bg-gray-50 dark:bg-[#282828] h-14 w-full",
      "flex items-center justify-between px-4",
      "border-b border-gray-200 dark:border-[#303030]",
      // Desktop positioning
      isCollapsed ? "md:pl-20" : "md:pl-64",
      "transition-all duration-300 ease-in-out",
      
    )}> */}

  <div className="px-3 py-3 lg:px-5 lg:pl-3">
    <div className="flex items-center justify-between gap-4">
      {/* Sidebar toggle button - natural width */}
      <button
        onClick={toggleSidebar}
        className="md:hidden  inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 flex-none"
      >
        <span className="sr-only">Open sidebar</span>
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
          />
        </svg>
      </button>

    
<div className="flex-grow min-w-0 md:flex-none md:max-w-xs w-full">
 
    {/* <WorkspaceDropdown
      workspaces={workspaces}
      selectedWorkspace={selectedWorkspace}
      onWorkspaceSelect={setSelectedWorkspace}
    /> */}
     <WorkspaceDropdown
                workspaces={workspaces}
                selectedWorkspace={selectedWorkspace}
                onWorkspaceSelect={onWorkspaceSelect}
                onCreateWorkspace={onCreateWorkspace}
              />
  
</div>


      {/* Profile section - natural width */}
      <div className="flex items-center justify-end flex-none min-w-0">
        
        <button
          onClick={toggleUserMenu}
          type="button"
          className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
        >
          <span className="sr-only">Open user menu</span>
          {/* {profilePicture ? (
            <img src={profilePicture} alt="user" className="w-8 h-8 rounded-full" />
          ) : (
            <FaUserCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          )} */}
          <Avatar className="w-8 h-8 bg-gray-800">
            <AvatarImage src={profilePicture} alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
        </button>

        {isUserMenuOpen && (
          <div className="absolute top-14 right-4 z-50 w-48 bg-[#282828] rounded-lg shadow-md dark:bg-[#282828]">
            <ul className="py-2">
              {userMenuData.map((item, index) => (
                <li
                  key={index}
                  onClick={() => handleMenuItemClick(item.onClick)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  </div>
</nav>



    </>
  );
}
