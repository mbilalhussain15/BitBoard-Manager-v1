import { useAuth } from "../../provider/auth-context";
import React from "react";
import { Navigate, Outlet } from "react-router";
import { Loader } from "../../components/loader/dotLoader";

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (<>
    
     <div className="fixed inset-0 z-50 flex justify-center items-center">
        <Loader />
      </div>
    </>);
  }

  // if (isAuthenticated) {
  //   return <Navigate to="/dashboard"/>;
  // }

  return (
    <>
    <div className="bg-green-400">
      <Outlet />
    </div>
    </>
  );
};

export default AuthLayout;