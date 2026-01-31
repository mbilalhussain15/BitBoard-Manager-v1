import { Listbox, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { BsChevronExpand } from "react-icons/bs";
import clsx from "clsx";
import { getInitials } from "../../utils";
import { MdCheck } from "react-icons/md";
import { useGetTeamListQuery } from "../../redux/slices/api/userApiSlice";
import "./Dropdown.css";

const TeamMembersDropdown = ({ setTeamMembers = () => {}, teamMembers = [], showError, resetFlag }) => {
  const { data, isLoading } = useGetTeamListQuery();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const unassignedOption = { id: "unassign", firstName: "Unassign" };

  useEffect(() => {
   
    if (teamMembers.length === 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(teamMembers);
     
    }
  }, [teamMembers]);

  useEffect(() => {
    if (resetFlag) {
      setSelectedUsers([]);
      setTeamMembers([]);
    }
  }, [resetFlag, setTeamMembers]);




  const handleChange = (selectedItems) => {
    let isUnassignSelected = false;
    const teamMembersSelected = [];

    // Iterate through selectedItems once to populate isUnassignSelected and teamMembersSelected
    selectedItems.forEach(item => {

    
      if (item.firstName  === "Unassign") {
            isUnassignSelected = true;
            teamMembersSelected.length = 0;
        } else {
                // Check if the item already exists in teamMembersSelected
            const index = teamMembersSelected.findIndex((member) => member._id === item._id);

            if (index === -1) {
                // Item does not exist, add it
                teamMembersSelected.push(item);
            } else {
                // Item exists, remove it
                teamMembersSelected.splice(index, 1);
            }
            // teamMembersSelected.push(item);
         
            
            // console.log("team =",teamMembersSelected)
            
        }
    });

    switch (true) {
        // Case 1: "Unassign" is selected and no other team members are selected
        case isUnassignSelected && teamMembersSelected.length === 0:
            // console.log("Unassign selected, clearing team members");
            setSelectedUsers([unassignedOption]);
            setTeamMembers([unassignedOption]);
            break;

        // Case 2: Team members are selected (even if "Unassign" was selected)
        case teamMembersSelected.length > 0:
            // console.log("Team members selected, deselecting Unassign if present");
            setSelectedUsers(teamMembersSelected);
            setTeamMembers(teamMembersSelected);
            break;

        // Case 3: No selection made
        default:
            // console.log("No selection made, clearing selections");
            setSelectedUsers([]);
            setTeamMembers([]);
            break;
    }
};

  const filteredData = Array.isArray(data)
    ? data.filter((user) => user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

//   const displayData = searchTerm.toLowerCase().includes("unassign") || searchTerm === ""
//     ? [unassignedOption, ...filteredData]
//     : filteredData;

const displayData = searchTerm.toLowerCase().includes("unassign".substring(0, searchTerm.length)) || searchTerm.trim() === ""
    ? [unassignedOption, ...filteredData]
    : filteredData;

  const noMembersFound = displayData.length === 0;

  return (
    <div>
      <p className="text-gray-700 dark:text-white">Team Members</p>
      <Listbox value={selectedUsers} onChange={handleChange} multiple>
        {({ open }) => (
          <>
            <Listbox.Button className="bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md border-1 border-lightInputBoxBorder dark:border-DarkInputBoxBorder border-solid relative w-full cursor-default pl-3 pr-10 text-left px-3 py-2.5 2xl:py-3 sm:text-sm">
              <span className="block truncate">
                {selectedUsers.length > 0
                  ? selectedUsers.map((user) => user?.firstName || "Unknown").join(", ")
                  : "Team Members"}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <BsChevronExpand className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            {/* <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            > */}
            <Transition
              as={Fragment}
              show={open} // Ensure the dropdown shows based on the open state
              appear // Include this prop for the initial appearance
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 transform scale-95"
              enterTo="opacity-100 transform scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 transform scale-100"
              leaveTo="opacity-0 transform scale-95"
            >
              <div className="relative">
                <Listbox.Options className="dropdown-menu bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md z-50 relative mt-1 max-h-60 w-full overflow-auto py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                  <div className="p-2">
                    <input
                      type="text"
                      className="w-full p-2 border-b mb-1 bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText"
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {noMembersFound ? (
                    <div className="py-2 px-4 text-gray-500">No members found</div>
                  ) : (
                    displayData.map((user, index) => (
                      <Listbox.Option
                        key={index}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? "bg-hoverColor text-dropDownCheck" : "text-lightText dark:text-darkText"
                          }`
                        }
                        value={user}
                      >
                        {({ selected }) => {
                          const hasFirstName = user?.firstName; 
                          const hasProfilePicture = user?.profileImage;
                          // Check if the user is in the selectedUsers array initially
                            const isInitiallySelected = selectedUsers.some((u) => 
                              u._id === user._id || (u.firstName === "Unassign" && user.firstName === "Unassign")
                            );
  
                            // Either it was initially selected (from backend), or it is currently selected by the Listbox state
                            const isUserSelected = selected || isInitiallySelected;
                                                
                          return(
                          <>
                            <div className={clsx("flex items-center gap-2 truncate", selected ? "font-medium" : "font-normal")}>
                              {/* <div className="w-6 h-6 rounded-full text-white flex items-center justify-center bg-violet-600">
                                <span className="text-center text-[10px]">
                                  {hasFirstName ? getInitials(user.firstName) : "N/A"}
                                </span>
                              </div> */}
                               {hasProfilePicture ? (
                                <div className="w-6 h-6 rounded-full">
                                  <img
                                    src={user.profileImage} // Assuming profilePicture is a URL
                                    alt={`${user.firstName}'s profile`}
                                    className="w-6 h-6 rounded-full"
                                  />
                                </div>
                                
                              ) : (
                                <div className="w-6 h-6 rounded-full text-white flex items-center justify-center bg-violet-600">
                                  <span className="text-center text-[10px]">
                                    {hasFirstName ? getInitials(user.firstName) : "N/A"}
                                  </span>
                                </div>
                              )}
                              <span>{hasFirstName ? user.firstName : "Unknown"}</span>
                            </div>
                            {isUserSelected  && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-dropDownCheck">
                                <MdCheck className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}}
                      </Listbox.Option>
                    ))
                  )}
                </Listbox.Options>
              </div>
            </Transition>
          </>
        )}
      </Listbox>
      {/* {(!teamMembers || teamMembers.length === 0) && showError && (
        <p className="text-red-500 text-sm mt-1 align">
          Please select the team member who will work on this Board.
        </p>
      )} */}
    </div>
  );
};

export default TeamMembersDropdown;

































// import { Listbox, Transition } from "@headlessui/react";
// import { Fragment, useEffect, useState } from "react";
// import { BsChevronExpand } from "react-icons/bs";
// import clsx from "clsx";
// import { getInitials } from "../../utils";
// import { MdCheck } from "react-icons/md";
// import { useGetTeamListQuery } from "../../redux/slices/api/userApiSlice";
// import "./Dropdown.css";

// const TeamMembersDropdown = ({ setTeamMembers = () => {}, teamMembers = [], showError, resetFlag }) => {
//   const { data, isLoading } = useGetTeamListQuery();
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");

//   const unassignedOption = { id: "unassign", firstName: "Unassign" };

//   useEffect(() => {
//     if (teamMembers.length === 0) {
//       setSelectedUsers([]);
//     } else {
//       setSelectedUsers(teamMembers);
//     }
//   }, [teamMembers]);

//   useEffect(() => {
//     if (resetFlag) {
//       setSelectedUsers([]);
//       setTeamMembers([]);
//     }
//   }, [resetFlag, setTeamMembers]);




//   const handleChange = (selectedItems) => {
//     let isUnassignSelected = false;
//     const teamMembersSelected = [];

//     // Iterate through selectedItems once to populate isUnassignSelected and teamMembersSelected
//     selectedItems.forEach(item => {
//         if (item.id === "unassign") {
//             isUnassignSelected = true;
//             teamMembersSelected.length = 0;
//         } else {
          
//             teamMembersSelected.push(item);
//             // console.log("team =",teamMembersSelected)
            
//         }
//     });

//     switch (true) {
//         // Case 1: "Unassign" is selected and no other team members are selected
//         case isUnassignSelected && teamMembersSelected.length === 0:
//             // console.log("Unassign selected, clearing team members");
//             setSelectedUsers([unassignedOption]);
//             setTeamMembers([unassignedOption]);
//             break;

//         // Case 2: Team members are selected (even if "Unassign" was selected)
//         case teamMembersSelected.length > 0:
//             // console.log("Team members selected, deselecting Unassign if present");
//             setSelectedUsers(teamMembersSelected);
//             setTeamMembers(teamMembersSelected);
//             break;

//         // Case 3: No selection made
//         default:
//             // console.log("No selection made, clearing selections");
//             setSelectedUsers([]);
//             setTeamMembers([]);
//             break;
//     }
// };

//   const filteredData = Array.isArray(data)
//     ? data.filter((user) => user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()))
//     : [];

// //   const displayData = searchTerm.toLowerCase().includes("unassign") || searchTerm === ""
// //     ? [unassignedOption, ...filteredData]
// //     : filteredData;

// const displayData = searchTerm.toLowerCase().includes("unassign".substring(0, searchTerm.length)) || searchTerm.trim() === ""
//     ? [unassignedOption, ...filteredData]
//     : filteredData;

//   const noMembersFound = displayData.length === 0;

//   return (
//     <div>
//       <p className="text-gray-700 dark:text-white">Team Members</p>
//       <Listbox value={selectedUsers} onChange={handleChange} multiple>
//         {({ open }) => (
//           <>
//             <Listbox.Button className="bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md border-1 border-lightInputBoxBorder dark:border-DarkInputBoxBorder border-solid relative w-full cursor-default pl-3 pr-10 text-left px-3 py-2.5 2xl:py-3 sm:text-sm">
//               <span className="block truncate">
//                 {selectedUsers.length > 0
//                   ? selectedUsers.map((user) => user?.firstName || "Unknown").join(", ")
//                   : "Team Members"}
//               </span>
//               <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
//                 <BsChevronExpand className="h-5 w-5 text-gray-400" aria-hidden="true" />
//               </span>
//             </Listbox.Button>

//             {/* <Transition
//               as={Fragment}
//               leave="transition ease-in duration-100"
//               leaveFrom="opacity-100"
//               leaveTo="opacity-0"
//             > */}
//             <Transition
//               as={Fragment}
//               show={open} // Ensure the dropdown shows based on the open state
//               appear // Include this prop for the initial appearance
//               enter="transition ease-out duration-200"
//               enterFrom="opacity-0 transform scale-95"
//               enterTo="opacity-100 transform scale-100"
//               leave="transition ease-in duration-150"
//               leaveFrom="opacity-100 transform scale-100"
//               leaveTo="opacity-0 transform scale-95"
//             >
//               <div className="relative">
//                 <Listbox.Options className="dropdown-menu bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md z-50 relative mt-1 max-h-60 w-full overflow-auto py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
//                   <div className="p-2">
//                     <input
//                       type="text"
//                       className="w-full p-2 border-b mb-1 bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText"
//                       placeholder="Search members..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                   </div>

//                   {noMembersFound ? (
//                     <div className="py-2 px-4 text-gray-500">No members found</div>
//                   ) : (
//                     displayData.map((user, index) => (
//                       <Listbox.Option
//                         key={index}
//                         className={({ active }) =>
//                           `relative cursor-default select-none py-2 pl-10 pr-4 ${
//                             active ? "bg-hoverColor text-dropDownCheck" : "text-lightText dark:text-darkText"
//                           }`
//                         }
//                         value={user}
//                       >
//                         {({ selected }) => {
//                           const hasFirstName = user?.firstName; 
//                           const isUserSelected = selectedUsers.some(selectedUser => selectedUser.id === user.id); // Check if user is in selectedUsers
//                           const isInTeamMembers = teamMembers.some(member => member.id === user.id); // Check if user is in teamMembers

//                           return(
//                           <>
//                             <div className={clsx("flex items-center gap-2 truncate", selected || isUserSelected ? "font-medium" : "font-normal")}>
//                               <div className="w-6 h-6 rounded-full text-white flex items-center justify-center bg-violet-600">
//                                 <span className="text-center text-[10px]">
//                                   {hasFirstName ? getInitials(user.firstName) : "N/A"}
//                                 </span>
//                               </div>
//                               <span>{hasFirstName ? user.firstName : "Unknown"}</span>
//                             </div>
//                             {(selected)  && (
//                               <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-dropDownCheck">
//                                 <MdCheck className="h-5 w-5" aria-hidden="true" />
//                               </span>
//                             )}
//                           </>
//                         )}}
//                       </Listbox.Option>
//                     ))
//                   )}
//                 </Listbox.Options>
//               </div>
//             </Transition>
//           </>
//         )}
//       </Listbox>
//       {/* {(!teamMembers || teamMembers.length === 0) && showError && (
//         <p className="text-red-500 text-sm mt-1 align">
//           Please select the team member who will work on this Board.
//         </p>
//       )} */}
//     </div>
//   );
// };

// export default TeamMembersDropdown;







































// import { Listbox, Transition } from "@headlessui/react";
// import { Fragment, useEffect, useState } from "react";
// import { BsChevronExpand } from "react-icons/bs";
// import clsx from "clsx";
// import { getInitials } from "../../utils";
// import { MdCheck } from "react-icons/md";
// import { useGetTeamListQuery } from "../../redux/slices/api/userApiSlice";
// import "./Dropdown.css";

// const TeamMembersDropdown = ({ setTeamMembers = () => {}, teamMembers = [], showError, resetFlag }) => {
//   const { data, isLoading } = useGetTeamListQuery();
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");

//   const unassignedOption = { id: "unassign", firstName: "Unassign" };

//   useEffect(() => {
//     if (teamMembers.length === 0) {
//       setSelectedUsers([]);
//     } else {
//       setSelectedUsers(teamMembers);
//     }
//   }, [teamMembers]);

//   useEffect(() => {
//     if (resetFlag) {
//       setSelectedUsers([]);
//       setTeamMembers([]);
//     }
//   }, [resetFlag, setTeamMembers]);




//   const handleChange = (selectedItems) => {
//     let isUnassignSelected = false;
//     const teamMembersSelected = [];

//     // Iterate through selectedItems once to populate isUnassignSelected and teamMembersSelected
//     selectedItems.forEach(item => {
//         if (item.id === "unassign") {
//             isUnassignSelected = true;
//             teamMembersSelected.length = 0;
//         } else {
          
//             teamMembersSelected.push(item);
//             // console.log("team =",teamMembersSelected)
            
//         }
//     });

//     switch (true) {
//         // Case 1: "Unassign" is selected and no other team members are selected
//         case isUnassignSelected && teamMembersSelected.length === 0:
//             // console.log("Unassign selected, clearing team members");
//             setSelectedUsers([unassignedOption]);
//             setTeamMembers([unassignedOption]);
//             break;

//         // Case 2: Team members are selected (even if "Unassign" was selected)
//         case teamMembersSelected.length > 0:
//             // console.log("Team members selected, deselecting Unassign if present");
//             setSelectedUsers(teamMembersSelected);
//             setTeamMembers(teamMembersSelected);
//             break;

//         // Case 3: No selection made
//         default:
//             // console.log("No selection made, clearing selections");
//             setSelectedUsers([]);
//             setTeamMembers([]);
//             break;
//     }
// };

//   const filteredData = Array.isArray(data)
//     ? data.filter((user) => user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()))
//     : [];

// //   const displayData = searchTerm.toLowerCase().includes("unassign") || searchTerm === ""
// //     ? [unassignedOption, ...filteredData]
// //     : filteredData;

// const displayData = searchTerm.toLowerCase().includes("unassign".substring(0, searchTerm.length)) || searchTerm.trim() === ""
//     ? [unassignedOption, ...filteredData]
//     : filteredData;

//   const noMembersFound = displayData.length === 0;

//   return (
//     <div>
//       <p className="text-gray-700 dark:text-white">Team Members</p>
//       <Listbox value={selectedUsers} onChange={handleChange} multiple>
//         {({ open }) => (
//           <>
//             <Listbox.Button className="bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md border-1 border-lightInputBoxBorder dark:border-DarkInputBoxBorder border-solid relative w-full cursor-default pl-3 pr-10 text-left px-3 py-2.5 2xl:py-3 sm:text-sm">
//               <span className="block truncate">
//                 {selectedUsers.length > 0
//                   ? selectedUsers.map((user) => user?.firstName || "Unknown").join(", ")
//                   : "Team Members"}
//               </span>
//               <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
//                 <BsChevronExpand className="h-5 w-5 text-gray-400" aria-hidden="true" />
//               </span>
//             </Listbox.Button>

//             {/* <Transition
//               as={Fragment}
//               leave="transition ease-in duration-100"
//               leaveFrom="opacity-100"
//               leaveTo="opacity-0"
//             > */}
//             <Transition
//               as={Fragment}
//               show={open} // Ensure the dropdown shows based on the open state
//               appear // Include this prop for the initial appearance
//               enter="transition ease-out duration-200"
//               enterFrom="opacity-0 transform scale-95"
//               enterTo="opacity-100 transform scale-100"
//               leave="transition ease-in duration-150"
//               leaveFrom="opacity-100 transform scale-100"
//               leaveTo="opacity-0 transform scale-95"
//             >
//               <div className="relative">
//                 <Listbox.Options className="dropdown-menu bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md z-50 relative mt-1 max-h-60 w-full overflow-auto py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
//                   <div className="p-2">
//                     <input
//                       type="text"
//                       className="w-full p-2 border-b mb-1 bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText"
//                       placeholder="Search members..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                   </div>

//                   {noMembersFound ? (
//                     <div className="py-2 px-4 text-gray-500">No members found</div>
//                   ) : (
//                     displayData.map((user, index) => (
//                       <Listbox.Option
//                         key={index}
//                         className={({ active }) =>
//                           `relative cursor-default select-none py-2 pl-10 pr-4 ${
//                             active ? "bg-hoverColor text-dropDownCheck" : "text-lightText dark:text-darkText"
//                           }`
//                         }
//                         value={user}
//                       >
//                         {({ selected }) => {
//                           const hasFirstName = user?.firstName; 
//                          
//                           return(
//                           <>
//                             <div className={clsx("flex items-center gap-2 truncate", selected ? "font-medium" : "font-normal")}>
//                               <div className="w-6 h-6 rounded-full text-white flex items-center justify-center bg-violet-600">
//                                 <span className="text-center text-[10px]">
//                                   {hasFirstName ? getInitials(user.firstName) : "N/A"}
//                                 </span>
//                               </div>
//                               <span>{hasFirstName ? user.firstName : "Unknown"}</span>
//                             </div>
//                             {selected  && (
//                               <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-dropDownCheck">
//                                 <MdCheck className="h-5 w-5" aria-hidden="true" />
//                               </span>
//                             )}
//                           </>
//                         )}}
//                       </Listbox.Option>
//                     ))
//                   )}
//                 </Listbox.Options>
//               </div>
//             </Transition>
//           </>
//         )}
//       </Listbox>
//       {/* {(!teamMembers || teamMembers.length === 0) && showError && (
//         <p className="text-red-500 text-sm mt-1 align">
//           Please select the team member who will work on this Board.
//         </p>
//       )} */}
//     </div>
//   );
// };

// export default TeamMembersDropdown;




































// import { Listbox, Transition } from "@headlessui/react";
// import { Fragment, useEffect, useState } from "react";
// import { BsChevronExpand } from "react-icons/bs";
// import clsx from "clsx";
// import { getInitials } from "../../utils";
// import { MdCheck } from "react-icons/md";
// import { useGetTeamListQuery } from "../../redux/slices/api/userApiSlice";

// const TeamMembersDropdown = ({ setTeamMembers = () => {}, teamMembers = [], showError, resetFlag }) => {
//   const { data, isLoading } = useGetTeamListQuery();
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");

//   // "Unassign" option
//   const unassignedOption = { id: "unassign", firstName: "Unassign" };

//   useEffect(() => {
//     if (teamMembers.length === 0) {
//       setSelectedUsers([]);
//     } else {
//       setSelectedUsers(teamMembers);
//     }
//   }, [teamMembers]);

//   useEffect(() => {
//     if (resetFlag) {
//       setSelectedUsers([]);
//       setTeamMembers([]);
//     }
//   }, [resetFlag, setTeamMembers]);

//   const handleChange = (selectedItems) => {
//     const isUnassignSelected = selectedItems.some(item => item.id === "unassign");

//     if (isUnassignSelected) {
//       // If "Unassign" is selected, deselect all other team members
//       setSelectedUsers([unassignedOption]);
//       setTeamMembers([unassignedOption]);
//     } else {
//       // If a team member is selected, remove "Unassign" from the selection
//       const teamMembersSelected = selectedItems.filter(item => item.id !== "unassign");

//       // Deselect "Unassign" when any team member is selected
//       if (teamMembersSelected.length > 0) {
//         setSelectedUsers(teamMembersSelected);
//         setTeamMembers(teamMembersSelected);
//       } else {
//         setSelectedUsers([]);
//         setTeamMembers([]);
//       }
//     }
//   };

//   // Filter team members based on search input, excluding "Unassign" by default
//   const filteredData = Array.isArray(data)
//     ? data.filter((user) =>
//         user.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     : [];

//   // Include "Unassign" in the filtered list only if it matches the search term
//   const displayData =
//     searchTerm.toLowerCase().includes("unassign") || searchTerm === ""
//       ? [unassignedOption, ...filteredData]
//       : filteredData;

//   const noMembersFound = displayData.length === 0;

//   return (
//     <div>
//       <p className="text-gray-700 dark:text-white">Team Members</p>
//       <Listbox value={selectedUsers} onChange={handleChange} multiple>
//         {({ open }) => (
//           <>
//             <Listbox.Button className="bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md border-1 border-lightInputBoxBorder dark:border-DarkInputBoxBorder border-solid relative w-full cursor-default pl-3 pr-10 text-left px-3 py-2.5 2xl:py-3 sm:text-sm">
//               <span className="block truncate">
//                 {selectedUsers.length > 0
//                   ? selectedUsers.map((user) => user?.firstName || "Unknown").join(", ")
//                   : "Team Members"}
//               </span>
//               <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
//                 <BsChevronExpand className="h-5 w-5 text-gray-400" aria-hidden="true" />
//               </span>
//             </Listbox.Button>

//             <Transition
//               as={Fragment}
//               leave="transition ease-in duration-100"
//               leaveFrom="opacity-100"
//               leaveTo="opacity-0"
//             >
//               <div className="relative">
//                 <Listbox.Options className="bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md z-50 relative mt-1 max-h-60 w-full overflow-auto py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                  
//                   {/* Search Input inside the List */}
//                   <div className="p-2">
//                     <input
//                       type="text"
//                       className="w-full p-2 border-b mb-1 bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText"
//                       placeholder="Search members..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                   </div>

//                   {noMembersFound ? (
//                     <div className="py-2 px-4 text-gray-500">No members found</div>
//                   ) : (
//                     displayData.map((user, index) => (
//                       <Listbox.Option
//                         key={index}
//                         className={({ active }) =>
//                           `relative cursor-default select-none py-2 pl-10 pr-4 ${
//                             active ? "bg-hoverColor text-dropDownCheck" : "text-lightText dark:text-darkText"
//                           }`
//                         }
//                         value={user}
//                       >
//                         {({ selected }) => (
//                           <>
//                             <div className={clsx("flex items-center gap-2 truncate", selected ? "font-medium" : "font-normal")}>
//                               <div className="w-6 h-6 rounded-full text-white flex items-center justify-center bg-violet-600">
//                                 <span className="text-center text-[10px]">
//                                   {user?.firstName ? getInitials(user.firstName) : "N/A"}
//                                 </span>
//                               </div>
//                               <span>{user?.firstName || "Unknown"}</span>
//                             </div>
//                             {selected && (
//                               <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-dropDownCheck">
//                                 <MdCheck className="h-5 w-5" aria-hidden="true" />
//                               </span>
//                             )}
//                           </>
//                         )}
//                       </Listbox.Option>
//                     ))
//                   )}
//                 </Listbox.Options>
//               </div>
//             </Transition>
//           </>
//         )}
//       </Listbox>
//       {(!teamMembers || teamMembers.length === 0) && showError && (
//         <p className="text-red-500 text-sm mt-1 align">
//           Please select the team member who will work on this Board.
//         </p>
//       )}
//     </div>
//   );
// };

// export default TeamMembersDropdown;





































// import { Listbox, Transition } from "@headlessui/react";
// import { Fragment, useEffect, useState } from "react";
// import { BsChevronExpand } from "react-icons/bs";
// import clsx from "clsx";
// import { getInitials } from "../../utils";
// import { MdCheck } from "react-icons/md";
// import { useGetTeamListQuery } from "../../redux/slices/api/userApiSlice";

// const TeamMembersDropdown = ({ setTeamMembers = () => {}, teamMembers = [], showError, resetFlag }) => {
//   const { data, isLoading } = useGetTeamListQuery();
//   const [selectedUsers, setSelectedUsers] = useState([]);

//   useEffect(() => {
//     if (teamMembers.length === 0) {
//       setSelectedUsers([]);
//     } else {
//       setSelectedUsers(teamMembers);
//     }
//   }, [data, teamMembers]);

//   useEffect(() => {
//     if (resetFlag) {
//       setSelectedUsers([]);
//       setTeamMembers([]); 
//     }
//   }, [resetFlag, setTeamMembers]);

//   const handleChange = (selectedItems) => {
//     setSelectedUsers(selectedItems);
//     setTeamMembers(selectedItems); 
//   };

//   return (
//     <div>
//       <p className="text-gray-700 dark:text-white">Team Members</p>
//       <Listbox value={selectedUsers} onChange={handleChange} multiple>
//         {({ open }) => (
//           <>
//             <Listbox.Button className="
            
//             bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md border-1 border-lightInputBoxBorder dark:border-DarkInputBoxBorder border-solid
//             relative w-full cursor-default pl-3 pr-10 text-left px-3 py-2.5 2xl:py-3 sm:text-sm">
//               <span className="block truncate">
//                 {selectedUsers.length > 0
//                   ? selectedUsers.map((user) => user?.firstName || "Unknown").join(", ")
//                   : "Team Members"}
//               </span>
//               <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
//                 <BsChevronExpand className="h-5 w-5 text-gray-400" aria-hidden="true" />
//               </span>
//             </Listbox.Button>

//             <Transition
//               as={Fragment}
//               leave="transition ease-in duration-100"
//               leaveFrom="opacity-100"
//               leaveTo="opacity-0"
//             >
//               <Listbox.Options className="
//               bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md
//               z-50 relative mt-1 max-h-60 w-full overflow-auto py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
//                 {Array.isArray(data) &&
//                   data.map((user, index) => (
//                     user && (
//                       <Listbox.Option
//                         key={index}
//                         className={({ active }) =>
//                           `relative cursor-default select-none py-2 pl-10 pr-4 ${
//                             active ? "bg-hoverColor text-dropDownCheck" : "text-lightText dark:text-darkText"
//                           }`
//                         }
//                         value={user}
//                       >
//                         {({ selected }) => (
//                           <>
//                             <div className={clsx("flex items-center gap-2 truncate", selected ? "font-medium" : "font-normal")}>
//                               <div className="w-6 h-6 rounded-full text-white flex items-center justify-center bg-violet-600">
//                                 <span className="text-center text-[10px]">
//                                   {user?.firstName ? getInitials(user.firstName) : "N/A"}
//                                 </span>
//                               </div>
//                               <span>{user?.firstName || "Unknown"}</span>
//                             </div>
//                             {selected && (
//                               <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-dropDownCheck">
//                                 <MdCheck className="h-5 w-5" aria-hidden="true" />
//                               </span>
//                             )}
//                           </>
//                         )}
//                       </Listbox.Option>
//                     )
//                   ))}
//               </Listbox.Options>
//             </Transition>
//           </>
//         )}
//       </Listbox>
//       {(!teamMembers || teamMembers.length === 0) && showError && (
//         <p className="text-red-500 text-sm mt-1 align">
//           Please select the team member who will work on this Board.
//         </p>
//       )}
//     </div>
//   );
// };

// export default TeamMembersDropdown;
