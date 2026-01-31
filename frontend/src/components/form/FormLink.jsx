import React from "react";
import { Link } from "react-router";

export const FormLink = ({
  to,
  children,
  className = "text-sm font-medium text-blue-600 hover:underline dark:text-green-500",
}) => {
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
};