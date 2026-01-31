// src/mocks/mockWorkspaceAPI.js
const mockWorkspaces = [
  {
    id: 1,
    name: 'My Personal Workspace',
    color: '#3b82f6',
    createdAt: '2023-01-15',
    updatedAt: '2023-06-20'
  },
  {
    id: 2,
    name: 'Team Project',
    color: '#10b981',
    createdAt: '2023-02-10',
    updatedAt: '2023-06-18'
  },
  {
    id: 3,
    name: 'Marketing Campaign',
    color: '#f59e0b',
    createdAt: '2023-03-05',
    updatedAt: '2023-06-15'
  },
];

export const mockWorkspaceAPI = {
  getWorkspaces: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: [...mockWorkspaces] });
      }, 500);
    });
  },
  
  createWorkspace: (workspace) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newWorkspace = {
          ...workspace,
          id: Math.max(...mockWorkspaces.map(w => w.id)) + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockWorkspaces.push(newWorkspace);
        resolve({ data: newWorkspace });
      }, 500);
    });
  }
};