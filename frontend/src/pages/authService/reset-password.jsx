import React, { useState } from "react"
import { useForm } from "react-hook-form"
// import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Link, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { useResetPasswordMutation } from "../../hooks/useAuthService"
import { resetPasswordSchema } from "../../lib/schema"
import { InputField } from "../../components/form/InputField"
import { Button } from "../../components/form/Button"


const ResetPassword = () => {
    const navigate = useNavigate();
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [isSuccess, setIsSuccess] = useState(false)

    const { mutate: resetPassword, isPending } = useResetPasswordMutation();

  const {
          register,
          handleSubmit,
          formState: { errors, isSubmitting },
          reset
      } = useForm({
          resolver: zodResolver(resetPasswordSchema),
          defaultValues: {
            newPassword: "",
            confirmPassword: ""
          }
      });

  const onSubmit = values => {
  if (!token) {
    toast.error("Invalid token")
    return
  }

  resetPassword(
    { ...values, token: token },
    {
      onSuccess: () => {
        setIsSuccess(true)
      },
      onError: error => {
        const errorMessage = error.response?.data?.message
        toast.error(errorMessage)
        console.log(error)
      }
    }
  )
}


  return (
   
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 px-5 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Reset Password
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Enter your new password below
            </p>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow rounded-lg sm:px-10">
            {isSuccess ? (
                <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-white">
                    Password reset successful
                </h3>
                <div className="mt-5">
                    {/* <Link
                    to="/sign-in"
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                    >
                    Back to sign in
                    </Link> */}
                    <Button
                        type="button"
                        onClick={() => navigate('/sign-in')}
                        >
                        Back to sign in
                    </Button>
                </div>
                </div>
            ) : (
                <>
                <div className="mb-6">
                    <Link
                    to="/sign-in"
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-500
                     dark:text-green-500 dark:hover:text-green-600"
                    >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to sign in
                    </Link>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <InputField
                    label="New Password"
                    name="newPassword"
                    type="password"
                    register={register}
                    errors={errors}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    />

                    <InputField
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    register={register}
                    errors={errors}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    />

                    <Button type="submit" isLoading={isSubmitting || isPending}>
                    Reset Password
                    </Button>
                </form>
                </>
            )}
            </div>
        </div>
    </div>

  )
}

export default ResetPassword
