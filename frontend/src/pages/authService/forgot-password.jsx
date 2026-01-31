import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useForgotPasswordMutation } from "../../hooks/useAuthService";
import { forgotPasswordSchema } from "../../lib/schema";
import { InputField } from "../../components/form/InputField";
import { Button } from "../../components/form/Button";

const ForgotPassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutate: forgotPassword, isPending } = useForgotPasswordMutation();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data) => {
    forgotPassword(data, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message;
        console.log(error);
        toast.error(errorMessage);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-5">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Forgot Password
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Enter your email to reset your password
            </p>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-6 rounded-lg">
            {isSuccess ? (
                <div className="rounded-md  p-4">
                <div className="flex flex-col items-center">
                    <div className="flex-shrink-0">
                    <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400" />
                    </div>
                    <div className="mt-3 text-center">
                    <h3 className="text-lg font-medium text-green-800 dark:text-green-100">
                        Password reset email sent
                    </h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                        <p>Check your email for a link to reset your password</p>
                    </div>
                    </div>
                </div>
                </div>
            ) : (
                <>
                <div className="mb-6">
                    <Link 
                    to="/sign-in" 
                    className="flex items-center text-sm font-medium
                     text-indigo-600 hover:text-indigo-500
                     dark:text-green-500 dark:hover:text-green-600"
                    >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to sign in
                    </Link>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    register={register}
                    errors={errors}
                    placeholder="example@company.com"
                    autoComplete="email"
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
  );
};

export default ForgotPassword;