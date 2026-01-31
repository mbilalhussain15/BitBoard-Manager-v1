import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { MdDashboard, MdClose } from 'react-icons/md';
import { PiKanbanFill } from 'react-icons/pi';
import { FaUsers, FaCodeBranch } from 'react-icons/fa';
import clsx from 'clsx';
import network from '../../assets/network.png';

import {
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ListCheck,
  LogOut,
  Settings,
  Users,
  Wrench,
} from "lucide-react";


const linkData = [
  { label: 'Code Collaboration', link: '/code-collaboration', icon: <FaCodeBranch size={18} /> },
  { label: 'Kanban Board', link: '/kanban', icon: <PiKanbanFill size={18} /> },
  { label: 'Chat', link: '/chat', icon: <FaUsers size={18} /> },
];


const navItems = [
    {
      label: "Dashboard",
      link: "/dashboard",
      icon: <LayoutDashboard size={18} />, // Add size prop or other styling
    },
    {
      label: "Workspaces",
      link: "/workspaces",
      icon: <Users size={18} />,
    },
    {
      label: "Collaboration",
      link: "/collaboration",
      icon: <FaCodeBranch size={18} />,
    },
    
    // {
    //   label: "Collaboration",
    //   link: "/code-collaboration",
    //   icon: <FaCodeBranch size={18} />,
    // },
    
    {
      label: "My Tasks",
      link: "/my-tasks",
      icon: <ListCheck size={18} />,
    },
    {
      label: "Members",
      link: "/members",
      icon: <Users size={18} />,
    },
    {
      label: "Achieved",
      link: "/achieved",
      icon: <CheckCircle2 size={18} />,
    },
    {
      label: "Settings",
      link: "/settings",
      icon: <Settings size={18} />,
    },
  ];

export default function SideBar(
  { 
    isSidebarOpen, 
    setIsSidebarOpen, 
    setIsUserMenuOpen, 
    currentWorkspace,
    isCollapsed,
  setIsCollapsed  
  }
) {

  const location = useLocation();
  const currentPath = location.pathname;
const toggleSidebarCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
  //   <div
  //   className={clsx(
  //     "fixed top-0 z-40 h-full bg-gray-50 dark:bg-[#282828] shadow-md",
  //     // Mobile behavior (controlled by isSidebarOpen)
  //     "sm:translate-x-0", // Remove mobile transform on desktop
  //     isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-0",
  //     // Desktop behavior (controlled by isCollapsed)
  //     "sm:w-64", // Default desktop width
  //     isCollapsed && "lg:w-20", // Collapsed only on large screens
  //     // Transition
  //     "transition-all duration-300 ease-in-out"
  //   )}
  // >

    //   <div
    //   className={clsx(
    //     "fixed top-0 left-0 z-40 h-full w-64 bg-gray-50 dark:bg-[#282828] shadow-md transition-transform duration-300 ",
    //     isSidebarOpen ? "translate-x-0" : "-translate-x-full",
    //     "sm:translate-x-0" 
    //   )}
    // >

    <div className={clsx(
  "fixed top-0 left-0 z-40 h-full bg-gray-50 dark:bg-[#282828] shadow-md",

  // Transition
  "transition-transform duration-300 ease-in-out", // Only transition transform

  // Mobile behavior
  isSidebarOpen ? "translate-x-0" : "-translate-x-full",
  // Desktop behavior
  "sm:translate-x-0 ", // Always visible on desktop
  // Width handling
  "w-64 transition-all duration-300", // Base width
  isCollapsed && "md:w-20 lg:w-20 xl:w-20 2xl:w-20 sm:w-20", // Collapsed width only on large screens
  
   "left-0"
)}>
    
  {/* Sidebar Header */}
  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#303030] py-3 relative">
    {/* Logo - always visible in some form */}
    <div className="flex items-center">
      <img src={network} className={clsx(
        "h-8",
        isCollapsed ? "mx-auto" : "me-3" // Center when collapsed
      )} alt="Logo" />
      {/* Name - hidden when collapsed */}
      <span className={clsx(
        "self-center text-xl font-semibold whitespace-nowrap dark:text-white text-black",
        isCollapsed ? "lg:hidden md:hidden xl:hidden 2xl:hidden sm:hidden" : ""
      )}>
        BitBoard
      </span>
    </div>

    {/* Mobile close button - only on mobile */}
    <button
      onClick={() => setIsSidebarOpen(false)}
      className="sm:hidden text-gray-400 hover:text-white"
    >
      <MdClose size={24} />
    </button>

    {/* Desktop toggle button - only on desktop */}
    <button
      onClick={toggleSidebarCollapse}
      className={clsx(
        "hidden sm:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 dark:text-gray-400  absolute",
        isCollapsed ? "right-2" : "right-3",
        "top-1/2 transform -translate-y-1/2"
      )}
    >
      {isCollapsed ? (
        <ChevronsRight size={20} />
      ) : (
        <ChevronsLeft size={20} />
      )}
    </button>
  </div>
  
  {/* Menu Items */}
  <div className="space-y-4 p-4 pt-4 overflow-hidden">
    {navItems.map((item, index) => (
      <Link
        key={index}
        to={item.link}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-full',
          'text-black dark:text-white hover:bg-indigo-100 dark:hover:bg-[#2c8f52]',
          'transition-all duration-300',
          currentPath === item.link ? 'bg-indigo-600 hover:bg-indigo-600 text-white dark:text-white dark:bg-green-800 dark:hover:bg-green-800' : '',
          isCollapsed ? "lg:justify-center lg:px-2" : ""
        )}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        <span className={clsx(
          "whitespace-nowrap",
          isCollapsed ? "lg:hidden md:hidden xl:hidden 2xl:hidden sm:hidden" : ""
        )}>
          {item.label}
        </span>
      </Link>
    ))}
  </div>
</div>
















    // <div
    //   className={clsx(
    //     "fixed top-0 left-0 z-40 h-full w-64 bg-gray-50 dark:bg-[#282828] shadow-md transition-transform duration-300 ",
    //     isSidebarOpen ? "translate-x-0" : "-translate-x-full",
    //     "sm:translate-x-0" 
    //   )}
    // >
    //   <div className="flex items-center justify-between p-4 border-b  border-gray-200 dark:border-[#303030] py-3">
    //     <div className="flex items-center">
    //       <img src={network} className="h-8 me-3" alt="Logo" />
    //       <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
    //         BitBoard
    //       </span>
    //     </div>
    //     <button
    //       onClick={() => setIsSidebarOpen(false)}
    //       className="sm:hidden text-gray-400 hover:text-white"
    //     >
    //       <MdClose size={24} />
    //     </button>
    //   </div>
    //   <div className="space-y-4 p-4 pt-4"> 
    //     {navItems.map((item, index) => (
    //       <Link
    //         key={index}
    //         // to={item.link}
    //         to={currentWorkspace ? `${item.link}?workspaceId=${currentWorkspace.id}` : item.link}
    // //        to={
    // //   currentWorkspace && item.link !== "/members" 
    // //     ? `${item.link}?workspaceId=${currentWorkspace.id}` 
    // //     : item.link
    // // }
    //         onClick={() => {
    //           setIsSidebarOpen(false);
    //           setIsUserMenuOpen(false);
    //         }}
    //         className={clsx(
    //           'flex items-center gap-2 px-3 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-[#2c8f52] dark:hover:bg-[#2c8f52]',
    //           currentPath === item.link ? 'bg-[#31a35d] text-white dark:bg-[#31a35d]' : ''
    //         )}
    //       >
    //         {item.icon}
    //         <span>{item.label}</span>
    //       </Link>
    //     ))}
    //   </div>
    // </div>
  );
}