import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

import App from "./App.jsx";
import ReactQueryProvider from "./provider/react-query-provider.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
// OPTIONAL: agar tum theme use karna chaho to apna ThemeProvider yahan wrap kar do
import ThemeProvider from "./components/theme/ThemeProvider.jsx";
import { WorkspaceProvider } from "./provider/WorkspaceProvider.jsx";
import { ProjectProvider } from "./provider/ProjectProvider.jsx";
import { BoardProvider } from "./provider/BoardProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <ReactQueryProvider>
        <WorkspaceProvider>
          <ProjectProvider>
            <BoardProvider>
              <ThemeProvider> 
                  <App />
              </ThemeProvider>
            </BoardProvider>
          </ProjectProvider>
        </WorkspaceProvider>
      </ReactQueryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
