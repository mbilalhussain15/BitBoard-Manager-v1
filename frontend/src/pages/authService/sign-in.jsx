import React from 'react'
import { signInSchema } from "../../lib/schema.js"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { InputField } from '../../components/form/InputField.jsx'
import { Button } from '../../components/form/Button.jsx'
import { FormLink } from '../../components/form/FormLink.jsx'
import { useGoogleAuthMutation, useLoginMutation } from '../../hooks/useAuthService'
import { useAuth } from '../../provider/auth-context'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function SignIn() {

    const navigate = useNavigate()
    const { login } = useAuth()

    const { mutate: googleAuthMutate, isPending: isGoogleAuthPending } = useGoogleAuthMutation();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    });

    const { mutate, isPending } = useLoginMutation()
    const handleOnSubmit = values => {
    mutate(values, {
        onSuccess: data => {
        login(data)
        console.log(data)
        toast.success("Login successful")
        navigate("/dashboard")
        },
        onError: error => {
        const errorMessage = error.response?.data?.message || "An error occurred"
        console.log(error)
        toast.error(errorMessage)
        }
    })
    }

    const handleGoogleSuccess = (credentialResponse) => {
        googleAuthMutate(
            { credential: credentialResponse.credential },
            {
                onSuccess: (data) => {
                    login(data);
                    toast.success("Google login successful");
                    navigate("/dashboard");
                },
                onError: (error) => {
                    const errorMessage = error.response?.data?.message || "Google login failed";
                    toast.error(errorMessage);
                }
            }
        );
    };

    const handleGoogleError = () => {
        toast.error("Google login failed");
    };
  
  return (
        <section className="bg-gray-50 dark:bg-gray-900 min-h-screen min-w-screen flex items-center justify-center p-4">
            <div className="container mx-auto max-w-screen-xl py-8 px-4">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
                {/* Left Content */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left">
                    <h1 className="mb-4 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-gray-900 dark:text-white">
                    <span  className='dark:text-green-500 text-blue-700 '>We help developers work and grow together</span>
                    </h1>
                    <p className="mb-6 text-base sm:text-lg md:text-xl font-normal text-gray-500 dark:text-gray-400">
                    At BitBoard, we make it easy to write code, manage tasks, and build projects with your team — all in one place, with the power of AI.
                    </p>
                    <div className="flex justify-center lg:justify-start">
                    </div>
                </div>

                {/* Right Content - Login Form */}
                <div className="w-full lg:w-1/2">
                    <div className="w-full max-w-md mx-auto lg:max-w-xl p-4 sm:p-6 space-y-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
                    <div className="text-center sm:text-left">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                            Sign in to <span className='dark:text-green-500 text-blue-700 '>BitBoard</span>
                        </h2>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-300 mt-1">
                            Sign in to your account to continue
                        </p>
                    </div>
                  
                    <form onSubmit={handleSubmit(handleOnSubmit)} className="mt-6 space-y-4">
                        <InputField
                            label="Email Address"
                            name="email"
                            type="email"
                            register={register}
                            errors={errors}
                            placeholder="example@company.com"
                            required
                            />

                            <InputField
                            label="Password"
                            name="password"
                            type="password"
                            register={register}
                            errors={errors}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            required
                            extraLabel={
                                <FormLink to="/forgot-password">
                                Forgot Password?
                                </FormLink>
                            }
                            />

                            <Button type="submit" isLoading={isSubmitting || isPending}>
                                Sign In
                            </Button>
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex items-center w-full">
                                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                                    <span className="px-3 text-sm text-gray-500 dark:text-gray-400">OR</span>
                                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                                </div>

                                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                                    <div className="w-full flex justify-center">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                        useOneTap
                                        text="continue_with"
                                        shape="pill"
                                        size="large"
                                        theme="filled_blue"
                                        logo_alignment="left"
                                        
                                        containerProps={{
                                            className:"w-full max-w-[400px] rounded-lg"}}
                                        
                                        />
                                        </div>
                                    </GoogleOAuthProvider>
                                </div>
                

                            <div className="mt-6 text-sm font-medium text-gray-900 dark:text-white text-center">
                            Not registered yet?{" "}
                            <FormLink to="/sign-up">
                                Create account
                            </FormLink>
                        </div>
                    </form>
                    </div>
                </div>
                </div>
            </div>
        </section>
  )
}

export default SignIn
