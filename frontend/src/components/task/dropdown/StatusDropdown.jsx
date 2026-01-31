import React,{useEffect} from "react";
import { Listbox, Transition } from "@headlessui/react";
import { BsChevronExpand } from "react-icons/bs";
import { MdCheck } from "react-icons/md";
import clsx from "clsx";
import { useStatusOptions } from "../../../hooks/others/useStatusOptions";

const StatusDropdown = ({status, setStatus, showError }) => {

  const [statusOptions] = useStatusOptions();

// Extract the values from the statusOptions elements
    const extractedStatusOptions = Array.isArray(statusOptions)
    ? statusOptions.map(option => option.props.value)
    : [];



  return (
    <div>
      <p className="text-gray-700 dark:text-white">Status</p>
      <Listbox value={status} onChange={setStatus}>
        {({ open }) => (
          <>
            <Listbox.Button className="
               dark:bg-[#232325] dark:text-white rounded-md border-1  border-solid
              relative w-full cursor-default pl-3 pr-10 text-left px-3 py-2.5 2xl:py-3 sm:text-sm   
              bg-white border-slate-300 dark:border-zinc-700 
                ">
              <span className="block truncate">
                {status ? status : "Select status"}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <BsChevronExpand className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              as={React.Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="
                bg-white dark:bg-zinc-800 dark:text-slate-100 rounded-md
                z-50 relative mt-1 max-h-60 w-full overflow-auto py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm
                border-slate-300 dark:border-zinc-700 border

                     
                ">
                {(extractedStatusOptions || []).map((statusOption, index) => (
                  <Listbox.Option
                    key={index}
                    className={({ active, selected }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-zinc-800 hover:bg-zinc-700 text-dropDownCheck" : "text-black dark:text-white"
                      } ${selected ? "font-medium" : "font-normal"}`
                    }
                    value={statusOption}
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex items-center gap-2 truncate">
                          <span>{statusOption}</span>
                        </div>
                        {console.log("Option: ", statusOption, " Selected: ", selected)}
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

       {/* {status.length === 0 && showError && ( */}
      {(!status || status.length === 0) && showError && (
        <p className="text-red-500 text-sm mt-1 align">
            Please select the status of this task.
        </p>
        )}
    </div>

  );
};

export default StatusDropdown;
