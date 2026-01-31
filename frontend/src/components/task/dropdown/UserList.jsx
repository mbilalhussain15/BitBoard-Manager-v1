import { Listbox, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { BsChevronExpand } from "react-icons/bs";
import clsx from "clsx";
import { getInitials } from "../../../utils/index";
import { MdCheck } from "react-icons/md";

const UserList = ({ members = [], setTeamAssignee = () => {}, teamAssignee = [], showError, resetFlag }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);

console.log("members=",members);
  const normalizedUsers = Array.isArray(members)
    ? members
        .map((m) => {
          // item can be either direct user or { user: <id|object> }
          const u = m?.user ?? m;
          
          const userId =
            (typeof u === "object" && (u._id || u.id)) ||
            (typeof u === "string" && u) ||
            m?._id ||
            null;

          // Try best-effort name fields
          const firstName =
            (typeof u === "object" && (u.firstName || u.name || u.fullName || u.displayName)) ||
            (typeof u === "string" && u) ||
            "";

          return userId
            ? { _id: userId, firstName }
            : null;
        })
        .filter(Boolean)
    : [];


  useEffect(() => {
    if (teamAssignee.length === 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(teamAssignee);
    }
  }, [teamAssignee]);

  useEffect(() => {
    if (resetFlag) {
      setSelectedUsers([]);
      setTeamAssignee([]); 
    }
  }, [resetFlag, setTeamAssignee]);

  const handleChange = (selectedItems) => {
    setSelectedUsers(selectedItems);
    setTeamAssignee(selectedItems); 
  };

  return (
    <div>
      <p className="text-gray-700 dark:text-white">Assignee</p>
      <Listbox value={selectedUsers} onChange={handleChange} multiple>
        {({ open }) => (
          <>
            <Listbox.Button className="
            
            bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md border-1 border-lightInputBoxBorder dark:border-DarkInputBoxBorder border-solid
            relative w-full cursor-default pl-3 pr-10 text-left px-3 py-2.5 2xl:py-3 sm:text-sm">
              <span className="block truncate">
                {selectedUsers.length > 0
                  ? selectedUsers.map((user) => user?.firstName || "Unknown").join(", ")
                  : "Assignee"}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <BsChevronExpand className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="
              bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md
              z-50 relative mt-1 max-h-60 w-full overflow-auto py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                { normalizedUsers.map((user, index) => (
                    
                      <Listbox.Option
                        key={user._id || index}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? "bg-hoverColor text-dropDownCheck" : "text-lightText dark:text-darkText"
                          }`
                        }
                        value={user}
                      >
                        
                        {({ selected }) => (
                          <>
                            <div className={clsx("flex items-center gap-2 truncate", selected ? "font-medium" : "font-normal")}>
                              <div className="w-6 h-6 rounded-full text-white flex items-center justify-center bg-violet-600">
                                <span className="text-center text-[10px]">
                                  {user?.firstName ? getInitials(user.firstName) : "N/A"}
                                </span>
                              </div>
                              <span>{user?.firstName || "Unknown"}</span>
                            </div>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-dropDownCheck">
                                <MdCheck className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                   
                  ))}
              </Listbox.Options>
            </Transition>
          </>
        )}
      </Listbox>
      {(!teamAssignee || teamAssignee.length === 0) && showError && (
        <p className="text-red-500 text-sm mt-1 align">
          Please select the team member who will do this task.
        </p>
      )}
    </div>
  );
};

export default UserList;