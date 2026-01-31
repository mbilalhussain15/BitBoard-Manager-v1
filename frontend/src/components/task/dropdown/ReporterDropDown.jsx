import { Listbox, Transition } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { BsChevronExpand } from "react-icons/bs";
import clsx from "clsx";
import { getInitials } from "../../../utils/index";
import { MdCheck } from "react-icons/md";

/**
 * Props
 *  members: currentBoard.members array
 *  teamReporter: selected reporter array with one item max
 *  setTeamReporter: setter from parent
 *  showError: boolean to show validation text
 */
const ReporterDropDown = ({
  members = [],
  teamReporter = [],
  setTeamReporter = () => {},
  showError = false,
}) => {
  const [selectedUser, setSelectedUser] = useState(null);

  // normalize members → [{ _id: string, firstName: string }]
  const normalizedUsers = useMemo(() => {
    if (!Array.isArray(members)) return [];
    return members
      .map((m) => {
        const u = m?.user ?? m; // can be object or string
        const id =
          (typeof u === "object" && (u._id || u.id)) ||
          (typeof u === "string" && u) ||
          m?._id ||
          null;

        // prefer populated name fields
        const firstName =
          (typeof u === "object" && (u.firstName || u.name || u.fullName || u.displayName)) ||
          (typeof u === "string" && u) ||
          "Unknown";

        return id ? { _id: String(id), firstName } : null;
      })
      .filter(Boolean);
  }, [members]);

  // keep local selection in sync with parent array
  useEffect(() => {
    if (teamReporter && teamReporter.length > 0) {
      setSelectedUser(teamReporter[0]);
    } else {
      setSelectedUser(null);
    }
  }, [teamReporter]);

  const handleChange = (item) => {
    setSelectedUser(item);
    setTeamReporter(item ? [item] : []);
  };

  return (
    <div>
      <p className="text-gray-700 dark:text-white">Reporter</p>

      <Listbox value={selectedUser} onChange={handleChange}>
        <>
          <Listbox.Button
            className="
              bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md border-1
              border-lightInputBoxBorder dark:border-DarkInputBoxBorder border-solid
              relative w-full cursor-default pl-3 pr-10 text-left px-3 py-2.5 2xl:py-3 sm:text-sm"
          >
            <span className="block truncate">
              {selectedUser ? selectedUser.firstName : "Reporter"}
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
            <Listbox.Options
              className="
                bg-lightInputBox dark:bg-DarkInputBox dark:text-darkText rounded-md
                z-50 relative mt-1 max-h-60 w-full overflow-auto py-1 text-base shadow-lg
                ring-1 ring-black/5 focus:outline-none sm:text-sm"
            >
              {normalizedUsers.map((user, idx) => (
                <Listbox.Option
                  key={user._id || String(idx)}
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
                            {getInitials(user.firstName)}
                          </span>
                        </div>
                        <span>{user.firstName}</span>
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
      </Listbox>

      {!selectedUser && showError && (
        <p className="text-red-500 text-sm mt-1">
          Please select the reporter for this task.
        </p>
      )}
    </div>
  );
};

export default ReporterDropDown;
