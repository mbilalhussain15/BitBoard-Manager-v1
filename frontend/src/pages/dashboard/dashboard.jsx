import React from 'react'
import { useAuth } from '../../provider/auth-context'
import { Button } from '../../components/form/Button'

export default function Dashboard() {
    const { user, logout } = useAuth()
    
    return (
         <div className="h-full flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard 1</h1>
            
            <div className="bg-gray-200 dark:bg-[#282828] rounded-lg p-4 md:p-6 shadow-md flex-1">
                <p className="text-gray-700 dark:text-gray-300 mb-4">Welcome back, {user?.name || user?.username}!</p>
                
                <div className="flex justify-end mt-auto">
                    <Button 
                        onClick={logout} 
                        text="Logout"
                        className="bg-[#31a35d] hover:bg-[#2c8f52] text-white"
                    />
                </div>
            </div>
        </div>
    )
}