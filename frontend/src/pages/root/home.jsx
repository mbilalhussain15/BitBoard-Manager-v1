import React from "react"
import { Link } from "react-router-dom";

function HomePage() {
  return (
  <div className="w-screen h-screen flex items-center justify-center gap-4">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to BitBoard!</h1>
      <p className="mb-6">Your one-stop solution for all things BitBoard.</p>
      <div className="flex gap-4 justify-center w-full max-w-xs mx-auto"> {/* Added max-width and margin auto */}
        <Link to="/sign-in" className="flex-1">
          <span role="button" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            Login
          </span>
        </Link>
        <Link to="/sign-up" className="flex-1">
          <span role="button" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            Sign Up
          </span>
        </Link>
      </div>
    </div>
  </div>
  )
}

export default HomePage
