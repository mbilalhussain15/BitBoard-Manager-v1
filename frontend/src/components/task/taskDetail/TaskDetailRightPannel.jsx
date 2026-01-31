import React from "react";
import { User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../../form/avatar"; // <-- adjust path
import { getInitials } from "../../../utils/index"; // <-- adjust path if needed

function TaskDetailRightPannel({ teamAssignee, teamReporter, status, priority }) {
  const assigneeName =
    teamAssignee?.fullName || teamAssignee?.firstName || teamAssignee?.name || "User";
  const assigneeImg =
    teamAssignee?.profileImage || teamAssignee?.profilePicture || teamAssignee?.avatarUrl || "";

  const reporterName =
    teamReporter?.fullName || teamReporter?.firstName || teamReporter?.name || "User";
  const reporterImg =
    teamReporter?.profileImage || teamReporter?.profilePicture || teamReporter?.avatarUrl || "";

  return (
    <div>
      {/* Priority */}
      <section className="flex flex-col mb-3">
        <p className="text-lightText dark:text-darkText mb-1 text-black dark:text-white">Priority</p>
        <input
          type="text"
          readOnly
          value={
            priority?.name ? priority.name.charAt(0).toUpperCase() + priority.name.slice(1) : "No Priority"
          }
          className="w-full rounded-md 
                     py-2.5 px-3 focus:outline-none cursor-default select-none text-black dark:text-white
                     bg-[#f5f5f5] dark:bg-[#242424] border-[#e5e5e5] dark:border-gray-700 border-1 "
        />
      </section>

      {/* Status */}
      <section className="flex flex-col mb-3">
        <p className="text-lightText dark:text-darkText mb-1 text-black dark:text-white">Status</p>
        <input
          type="text"
          readOnly
          value={status?.name ? status.name : "No Status"}
          className="w-full rounded-md 
                     py-2.5 px-3 focus:outline-none cursor-default select-none text-black dark:text-white
                     bg-[#f5f5f5] dark:bg-[#202020] border-[#e5e5e5] dark:border-gray-700 border-1 "
        />
      </section>

      {/* Assignee */}
      <section className="flex flex-col mb-1">
        <p className="text-black dark:text-white">Assignee</p>
        <div className="rounded-md py-2.5 w-full flex items-center gap-2">
          {teamAssignee ? (
            <div className="w-full flex items-center gap-2 py-2.5 px-3 rounded-md bg-[#f5f5f5] dark:bg-[#202020] border-[#e5e5e5] dark:border-gray-700 border-1">
              {assigneeImg ? (
                <Avatar className="w-7 h-7">
                  <AvatarImage src={assigneeImg} alt={assigneeName} />
                  <AvatarFallback>{getInitials(assigneeName)}</AvatarFallback>
                </Avatar>
              ) : (
                <User className="w-7 h-7 text-gray-400" />
              )}
              <span className="truncate text-black dark:text-white">{assigneeName}</span>
            </div>
          ) : (
            <span className="text-black dark:text-white">Assignee</span>
          )}
        </div>
      </section>

      {/* Reporter */}
      <section className="flex flex-col mb-1">
        <p className="text-black dark:text-white">Reporter</p>
        <div className="rounded-md py-2.5 w-full flex items-center gap-2">
          {teamReporter ? (
            <div className="w-full flex items-center gap-2 py-2.5 px-3 rounded-md bg-[#f5f5f5] dark:bg-[#202020] border-[#e5e5e5] dark:border-gray-700 border-1">
              {reporterImg ? (
                <Avatar className="w-7 h-7">
                  <AvatarImage src={reporterImg} alt={reporterName} />
                  <AvatarFallback>{getInitials(reporterName)}</AvatarFallback>
                </Avatar>
              ) : (
                <User className="w-7 h-7 text-gray-400" />
              )}
              <span className="truncate text-black dark:text-white">{reporterName}</span>
            </div>
          ) : (
            <span className="text-black dark:text-white">Reporter</span>
          )}
        </div>
      </section>
    </div>
  );
}

export default TaskDetailRightPannel;




















// import { User } from 'lucide-react'
// import React from 'react'

// function TaskDetailRightPannel({teamAssignee,teamReporter, status,priority}) {




//   return (
//     <div >
//       {/* <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//             Side Panel 1
//           </h2>
//           <p className="text-gray-700 dark:text-gray-300">
//             Additional details, status, or quick actions go here.
//           </p> */}


//         {/* Priority */}
//       <section className="flex flex-col mb-3">
//         <p className="text-lightText dark:text-darkText mb-1 text-black dark:text-white">Priority</p>
//         <input
//           type="text"
//           readOnly
//           value={priority?.name ? priority.name.charAt(0).toUpperCase() + priority.name.slice(1) : "No Priority"}
//           className="w-full rounded-md 
//                      py-2.5 px-3 focus:outline-none cursor-default select-none text-black dark:text-white
//                      bg-[#f5f5f5] dark:bg-[#242424] border-[#e5e5e5] dark:border-gray-700 border-1 "
//         />
//       </section>

//       {/* Status */}
//       <section className="flex flex-col mb-3">
//         <p className="text-lightText dark:text-darkText mb-1 text-black dark:text-white">Status</p>
//         <input
//           type="text"
//           readOnly
//           value={status?.name ? status.name : "No Status"}
//           className="w-full rounded-md 
//                      py-2.5 px-3 focus:outline-none cursor-default select-none text-black dark:text-white
//                      bg-[#f5f5f5] dark:bg-[#202020] border-[#e5e5e5] dark:border-gray-700 border-1 "
                     
//         />
//       </section>


//         <section className="flex flex-col mb-1">
//           <p className=" text-black dark:text-white">Assignee</p>
//           <div className="rounded-md py-2.5 w-full flex items-center gap-2">
//             {teamAssignee ? (
//               <>
//               <div className='w-full flex items-center gap-2 py-2.5 px-3 rounded-md bg-[#f5f5f5] dark:bg-[#202020] border-[#e5e5e5] dark:border-gray-700 border-1 '>
//                 {teamAssignee.profileImage ? (
//                   <img
//                     src={teamAssignee.profileImage}
//                     alt={teamAssignee.firstName}
//                     className="w-7 h-7 rounded-full object-cover"
//                   />
//                 ) : (
//                   <User className="w-7 h-7 text-gray-400" />
//                 )}
//                 <span className="truncate text-black dark:text-white">
//                   {teamAssignee.firstName || "Unknown"}
//                 </span>
//                 </div>
//               </>
//             ) : (
//               <span className="text-black dark:text-white">Assignee</span>
//             )}
//           </div>
//         </section>

//         <section className="flex flex-col mb-1">
//           <p className="text-black dark:text-white">Reporter</p>
//           <div className="rounded-md py-2.5 w-full flex items-center gap-2">
//             {teamReporter ? (
//               <>
//               <div className='w-full flex items-center gap-2 py-2.5 px-3 rounded-md bg-[#f5f5f5] dark:bg-[#202020] border-[#e5e5e5] dark:border-gray-700 border-1 '>
//                 {teamReporter.profileImage ? (
//                   <img
//                     src={teamReporter.profileImage}
//                     alt={teamReporter.firstName}
//                     className="w-7 h-7 rounded-full object-cover"
//                   />
//                 ) : (
//                   <User className="w-7 h-7 text-gray-400" />
//                 )}
//                 <span className="truncate text-black dark:text-white">
//                   {teamReporter.firstName || "Unknown"}
//                 </span>
//                 </div>
//               </>
//             ) : (
//               <span className="text-black dark:text-white">Reporter</span>
//             )}
//           </div>
//         </section>

//     </div>
//   )
// }

// export default TaskDetailRightPannel
