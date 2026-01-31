import React from "react";
import { Loader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";


export const Button = ({
  type = "button",
  children,
  isLoading = false,
  className = "",
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={isLoading}
      className={twMerge("mt-10 w-full px-5 py-3 text-base font-medium text-center text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800   flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed", className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
};