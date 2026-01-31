import { Routes, Route } from "react-router-dom";
import { useAuth } from "./provider/auth-context.jsx";
import { Navigate, useLocation } from "react-router-dom";

// pages — apne actual paths lagao

// import SignIn from "./pages/SignIn.jsx";
// import Dashboard from "./pages/Dashboard.jsx";
// import NotFound from "./pages/NotFound.jsx";
import HomePage from "./pages/root/home.jsx";
import AuthLayout from "./pages/authService/auth-layout.jsx";
import CatchAll from "./pages/authService/catch-all.jsx";
import SignIn from "./pages/authService/sign-in.jsx";
import SignUp from "./pages/authService/sign-up.jsx";
import ForgotPassword from "./pages/authService/forgot-password.jsx";
import ResetPassword from "./pages/authService/reset-password.jsx";
import VerifyEmail from "./pages/authService/verify-email.jsx";

import MainLayout from "./pages/layoutes/MainLayout.jsx";
import Dashboard from "./pages/dashboard/dashboard.jsx";
import Workspaces from "./pages/workspaces/workspaces.jsx";
import WorkspaceDetails from "./pages/workspaces/workspace-details.jsx";
import ProjectDetails from "./pages/projects/project-details.jsx";
import MainBoard from "./pages/boards/MainBoard.jsx";
import TaskDetail from "./pages/boards/task/TaskDetail.jsx";
import CollaborationEmbed from "./pages/CollaborationEmbed.jsx";


export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<HomePage />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="sign-up" element={<SignUp />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-email" element={<VerifyEmail />} /> 
        <Route path="*" element={<CatchAll />} />
      </Route>
      
      <Route  element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspaces" element={<Workspaces />} />
        <Route path="workspaces/:workspaceId/projects" element={<WorkspaceDetails />} />
        <Route path="workspaces/:workspaceId/projects/:projectId/boards" element={<ProjectDetails />} />
        <Route path="workspaces/:workspaceId/projects/:projectId/boards/:boardId" element={<MainBoard />} />
        <Route path="workspaces/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId" element={<TaskDetail />} />
        {/* <Route path="/members" element={<Members />} /> */}

        <Route path="/collaboration" element={<CollaborationEmbed />} />

      </Route>
    </Routes>
  );
}

// components/ProtectedRoute.jsx

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null; // yahan spinner lagana ho to laga do
  if (!isAuthenticated) return <Navigate to="/sign-in" replace state={{ from: location }} />;
  return children;
}























// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
