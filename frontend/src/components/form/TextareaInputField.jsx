// TextareaInputField.jsx
import React from "react";

export const TextareaInputField = ({
  label,
  name,
  register,
  errors,
  placeholder = "",
  required = false,
  className = "",
  extraLabel = null,
  rows = 4,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={name}
            className="block text-sm font-medium text-gray-900 dark:text-white"
          >
            {label}
          </label>
        )}
        {extraLabel}
      </div>
      <div className="relative">
        <textarea
          {...register(name)}
          id={name}
          placeholder={placeholder}
          className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            block w-full p-2.5
            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
            dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500
            ${className}`}
          required={required}
          rows={rows}
        />
      </div>
      {errors && errors[name] && (
        <p className="mt-1 text-sm text-red-600">{errors[name].message}</p>
      )}
    </div>
  );
};