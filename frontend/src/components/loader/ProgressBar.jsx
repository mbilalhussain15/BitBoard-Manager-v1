import React from 'react';

const ProgressBar = ({ label, percentage }) => {
  // Determine the color of the progress bar
  const getProgressBarColor = () => {
    if (percentage === 100) return 'bg-green-600'; // Green for 100%
    if (percentage > 50) return 'bg-yellow-600'; // Yellow for >50%
    return 'bg-blue-600'; // Blue for <=50%
  };

  // Format percentage value
  const formattedPercentage = percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(1);

  // Checkmark icon with circular badge
  const checkmarkBadge = percentage === 100 ? (
    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center ml-2 mt-1">
      <svg
        className="w-4 h-4 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
  ) : null;

  return (
    <div className='relative w-full'>
      <div className="flex items-center mb-1">
        <span className="text-base font-medium text-blue-700 dark:text-white mt-1">
          {label}
        </span>
        {checkmarkBadge}
        <span className="text-sm font-medium text-blue-700 dark:text-white ml-auto">
          {formattedPercentage}%
        </span>
      </div>
      <div className="relative w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          className={`h-2.5 rounded-full ${getProgressBarColor()}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;


































// import React from 'react';

// const ProgressBar = ({ label, percentage }) => {
//   // Determine the color of the progress bar
//   const getProgressBarColor = () => {
//     if (percentage === 100) return 'bg-green-600'; // Green for 100%
//     if (percentage > 50) return 'bg-yellow-600'; // Yellow for >50%
//     return 'bg-blue-600'; // Blue for <=50%
//   };

//   // Determine the color and presence of the checkmark
//   const checkmark = percentage === 100 ? (
//     <svg
//       className="w-5 h-5 text-green-600"
//       xmlns="http://www.w3.org/2000/svg"
//       fill="none"
//       viewBox="0 0 24 24"
//       stroke="currentColor"
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         strokeWidth="2"
//         d="M5 13l4 4L19 7"
//       />
//     </svg>
//   ) : null;

//   return (
//     <div className='w-full'>
//       <div className="flex justify-between mb-1">
//         <span className="text-base font-medium text-blue-700 dark:text-white">
//           {label}
//         </span>
//         <span className="text-sm font-medium text-blue-700 dark:text-white">
//           {percentage}%
//         </span>
//       </div>
//       <div className="relative w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
//         <div
//           className={`h-2.5 rounded-full ${getProgressBarColor()}`}
//           style={{ width: `${percentage}%` }}
//         ></div>
//         {checkmark && (
//           <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2">
//             {checkmark}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ProgressBar;






















// import React from 'react';

// const ProgressBar = ({ label, percentage }) => {
//   return (
//     <div className='w-full'>
//       <div className="flex justify-between mb-1">
//         <span className="text-base font-medium text-blue-700 dark:text-white">
//           {label}
//         </span>
//         <span className="text-sm font-medium text-blue-700 dark:text-white">
//           {percentage}%
//         </span>
//       </div>
//       <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
//         <div
//           className="bg-blue-600 h-2.5 rounded-full"
//           style={{ width: `${percentage}%` }}
//         ></div>
//       </div>
//     </div>
//   );
// };

// export default ProgressBar;
