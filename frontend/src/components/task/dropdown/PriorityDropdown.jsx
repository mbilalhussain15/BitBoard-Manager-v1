import React from "react";
import { Listbox, Transition } from "@headlessui/react";
import { BsChevronExpand } from "react-icons/bs";
import { MdKeyboardDoubleArrowUp, MdViewStream, MdKeyboardArrowDown, MdCheck } from "react-icons/md";

const PriorityDropdown = ({ priority, setPriority, showError }) => {
  
  const priorityOptions = [
    { label: "High", value: "high", icon: <MdKeyboardDoubleArrowUp className="h-5 w-5 text-red-500" /> },
    { label: "Medium", value: "medium", icon: <MdViewStream className="h-5 w-5 text-orange-500" /> },
    { label: "Low", value: "low", icon: <MdKeyboardArrowDown className="h-5 w-5 text-blue-500" /> },
  ];

  const selectedOption = priorityOptions.find(option => option.value === priority);

  return (
    <div>
      <p className="text-gray-700 dark:text-white">Priority Level</p>
      <Listbox value={priority} onChange={(value) => setPriority(value)}>
        {({ open }) => (
          <>
            <Listbox.Button
              className="
                 dark:bg-[#232325] dark:text-white rounded-md border-1  border-solid
              relative w-full cursor-default pl-3 pr-10 text-left px-3 py-2.5 2xl:py-3 sm:text-sm   
              bg-white border-slate-300 dark:border-zinc-700 "
            >
              <span className="block truncate">
                {selectedOption ? selectedOption.label : "Select priority"}
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
              <Listbox.Options
                className="
                      bg-white dark:bg-zinc-800 dark:text-slate-100 rounded-md
                z-50 relative mt-1 max-h-60 w-full overflow-auto py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm
                border-slate-300 dark:border-zinc-700 border"
              >
                {priorityOptions.map((option, index) => (
                  <Listbox.Option
                    key={index}
                    className={({ active, selected }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-zinc-800 hover:bg-zinc-700 text-dropDownCheck" : "text-lightText dark:text-white"
                      } ${selected ? "font-medium" : "font-normal"}`
                    }
                    value={option.value}
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">{option.icon}</span>
                          <span>{option.label}</span>
                        </div>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-dropDownCheck">
                            <MdCheck className="h-5 w-5 text-dropDownCheck" aria-hidden="true" />
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

      {showError && (!priority || !selectedOption) && (
        <p className="text-red-500 text-sm mt-1">
          Please select the priority level for this task.
        </p>
      )}
    </div>
  );
};

export default PriorityDropdown;
