import axios from "axios";

// Base URLs for microservices
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:5001/api-v1";
const WORKSPACE_SERVICE_URL = import.meta.env.VITE_WORKSPACE_SERVICE_URL || "http://localhost:5002/api-v1";
const COMMENT_SERVICE_URL = import.meta.env.VITE_COMMENT_SERVICE_URL || "http://localhost:5003/api-v1";
const AI_PLANNER_SERVICE_URL = import.meta.env.VITE_AI_PLANNER_SERVICE_URL || "http://localhost:5004";

const createClient = (baseURL: string) => {
  const client = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        window.dispatchEvent(new Event("force-logout"));
      }
      return Promise.reject(err);
    }
  );

  return client;
};

export const authApi = createClient(AUTH_SERVICE_URL);
export const workspaceApi = createClient(WORKSPACE_SERVICE_URL);
export const projectApi = createClient(WORKSPACE_SERVICE_URL);
export const boardApi = createClient(WORKSPACE_SERVICE_URL);
export const taskApi = createClient(WORKSPACE_SERVICE_URL);
export const commentApi = createClient(COMMENT_SERVICE_URL);
export const aiPlannerApi = createClient(AI_PLANNER_SERVICE_URL);


















// import axios from "axios";

// const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api-v1";

// const api = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token ?? ""}`;
//   }
//   return config;
// });

// // Add a global handler for 401 errors
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       // Dispatch a custom event to trigger logout in AuthProvider
//       window.dispatchEvent(new Event("force-logout"));
//     }
//     return Promise.reject(error);
//   }
// );

// const postData = async <T>(url: string, data: unknown): Promise<T> => {
//   const response = await api.post(url, data);

//   return response.data;
// };

// const updateData = async <T>(url: string, data: unknown): Promise<T> => {
//   const response = await api.put(url, data);

//   return response.data;
// };

// const fetchData = async <T>(url: string): Promise<T> => {
//   const response = await api.get(url);

//   return response.data;
// };

// const deleteData = async <T>(url: string): Promise<T> => {
//   const response = await api.delete(url);

//   return response.data;
// };

// export { postData, fetchData, updateData, deleteData };