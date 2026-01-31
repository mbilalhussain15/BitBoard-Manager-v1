import React, { useEffect, useState } from "react";
// import { Link, useSearchParams } from "react-router-dom";
import { Link, useSearchParams } from "react-router";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useVerifyEmailMutation } from "../../hooks/useAuthService";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [isSuccess, setIsSuccess] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const { mutate, isPending: isVerifying } = useVerifyEmailMutation();

  useEffect(() => {
    if (token) {
      mutate(
        { token },
        {
         
          onSuccess: (response) => {
             console.log("Verifying= ", response)
            if (response.code === "ALREADY_VERIFIED") {
              setVerificationStatus('already_verified');
              toast.success("Your email is already verified");
            } else {
            
              setVerificationStatus('success');
              toast.success("Email verified successfully!");
            }
          },
          onError: (error) => {
            
            console.error("Email verification error:",error);
            setVerificationStatus('error');
            const errorMessage = error.response?.data?.message || 
              "Email verification failed. The link may be invalid or expired.";
            toast.error(errorMessage);
          },
        }
      );
    } else {
      setVerificationStatus('error');
      toast.error("No verification token provided");
    }
  }, [token, mutate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Email Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex flex-col items-center justify-center space-y-4">
            {isVerifying ? (
              <>
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900">
                  Verifying your email...
                </h3>
                <p className="text-sm text-gray-500">
                  Please wait while we verify your email address.
                </p>
              </>
            ) : verificationStatus === 'success' ? (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Verification Successful!
                </h3>
                <p className="text-sm text-gray-500">
                  Your email address has been successfully verified.
                </p>
                <Link
                  to="/sign-in"
                  className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue to Sign In
                </Link>
              </>
            ): verificationStatus === 'already_verified' ? (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Email Already Verified
                </h3>
                <p className="text-sm text-gray-500">
                  Your email address was already verified.
                </p>
                <Link
                  to="/sign-in"
                  className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue to Sign In
                </Link>
              </>
            )
             : (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Verification Failed
                </h3>
                <p className="text-sm text-gray-500">
                  The verification link is invalid or has expired.
                </p>
                <div className="mt-6 w-full space-y-2">
                  <Link
                    to="/sign-in"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Sign In
                  </Link>
                  {token && (
                    <button
                      onClick={() => mutate({ token })}
                      className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;