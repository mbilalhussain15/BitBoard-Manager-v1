// InputField.jsx
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const InputField = ({
  type = "text",
  label,
  name,
  register,
  errors,
  placeholder = "",
  required = false,
  autoComplete = "off",
  className = "",
  extraLabel = null,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";

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
      <div className="relative ">
        <input
          {...register(name)}
          type={isPasswordField && showPassword ? "text" : type}
          id={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            block w-full p-2.5
            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
            dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500
            ${className}`}
          required={required}
        />
        {isPasswordField && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-700 dark:text-gray-300"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      {errors && errors[name] && (
        <p className="mt-1 text-sm text-red-600">{errors[name].message}</p>
      )}
    </div>
  );
};