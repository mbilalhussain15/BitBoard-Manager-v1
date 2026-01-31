import React from 'react'
import { signUpSchema } from "../../lib/schema.js"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import { InputField } from '../../components/form/InputField.jsx'
import { Button } from '../../components/form/Button.jsx'
import { FormLink } from '../../components/form/FormLink.jsx'
import { useSignUpMutation } from '../../hooks/useAuthService.ts'
function SignUp() {

    const navigate = useNavigate()
    // const { login } = useAuth()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
            confirmPassword: ""
        }
    });

    const { mutate, isPending } = useSignUpMutation()

  const onSubmit = values => {
    mutate(values, {
        onSuccess: () => {
        toast.success("Email Verification Required", {
            description:
            "Please check your email for a verification link. If you don't see it, please check your spam folder."
        })

        reset();
        navigate("/sign-in")
        },
        onError: error => {
        const errorMessage = error.response?.data?.message || "An error occurred"
        console.log(error)
        toast.error(errorMessage)
        }
    })
}

    
  return (
        <section className="bg-gray-50 dark:bg-gray-900 min-h-screen min-w-screen flex items-center justify-center p-4">
            <div className="container mx-auto max-w-screen-xl py-8 px-4">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
                {/* Left Content */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left">
                    <h1 className="mb-4 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-gray-900 dark:text-white">
                    <span  className='dark:text-green-500 text-indigo-700 '>We help developers work and grow together</span>
                    </h1>
                    <p className="mb-6 text-base sm:text-lg md:text-xl font-normal text-gray-500 dark:text-gray-400">
                    At BitBoard, we make it easy to write code, manage tasks, and build projects with your team — all in one place, with the power of AI.
                    </p>
                    <div className="flex justify-center lg:justify-start">
                    {/* <a
                        href="#"
                        className="text-blue-600 dark:text-blue-500 hover:underline font-medium text-lg inline-flex items-center"
                    >
                        Read more about our app
                        <svg
                        className="w-3.5 h-3.5 ms-2 rtl:rotate-180"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 14 10"
                        >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M1 5h12m0 0L9 1m4 4L9 9"
                        />
                        </svg>
                    </a> */}
                    </div>
                </div>

                {/* Right Content - Login Form */}
                <div className="w-full lg:w-1/2">
                    <div className="w-full max-w-md mx-auto lg:max-w-xl p-4 sm:p-6 space-y-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
                    <div className="text-center sm:text-left">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                            Sign up to <span className='dark:text-green-500 text-indigo-700 '>BitBoard</span>
                        </h2>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-300 mt-1">
                            Create an account to continue
                        </p>
                    </div>
                  
                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                       <InputField
                            label="Full Name"
                            name="name"
                            type="name"
                            register={register}
                            errors={errors}
                            placeholder="John Doe"
                            required
                            />
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
                                Sign Up
                            </Button>

                            <div className="mt-6 text-sm font-medium text-gray-900 dark:text-white text-center">
                            Already have an account?{" "}
                            <FormLink to="/sign-in">
                                Sign in
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

export default SignUp
