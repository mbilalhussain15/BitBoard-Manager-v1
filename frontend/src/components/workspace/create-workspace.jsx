import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { InputField } from '../form/InputField';
import { TextareaInputField } from '../form/TextareaInputField';
import { Button } from '../form/Button';
import { colorOptions } from '../../utils/colorConfig';
import { useCreateWorkspace } from '../../hooks/useWorkspace';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { WorkspaceContext } from '../../context/WorkspaceContext';

// const colorOptions = [
//   "#FF5733", // Red-Orange
//   "#33C1FF", // Blue
//   "#28A745", // Green
//   "#FFC300", // Yellow
//   "#8E44AD", // Purple
//   "#E67E22", // Orange
//   "#2ECC71", // Light Green
//   "#34495E", // Navy
// ];


const CreateWorkspace = ({ isCreatingWorkspace, setIsCreatingWorkspace }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      WorkspaceName: '',
      WorkspaceDescription: '',
      WorkspaceColor: colorOptions[0].hex
    }
  });

  const selectedColorHex = watch("WorkspaceColor");

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isCreatingWorkspace) {
      document.body.style.overflow = 'hidden';
      // Reset form when modal opens
      reset({
        WorkspaceName: '',
        WorkspaceDescription: '',
        WorkspaceColor: colorOptions[0].hex
      });
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isCreatingWorkspace, reset]);

  const toggleModal = () => {
    setIsCreatingWorkspace(!isCreatingWorkspace);
  };

  const { refetchWorkspaces, setCurrentWorkspace, setWorkspaces } = useContext(WorkspaceContext);


  const navigate= useNavigate();

const { mutateAsync, isPending } = useCreateWorkspace();

const sortByCreatedDesc = (a, b) =>
  new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime();

const onSubmit = async (data) => {
  try {
    const created = await mutateAsync(data); 
    setWorkspaces(prev => [...prev, created].sort(sortByCreatedDesc));
    setCurrentWorkspace(created);
    console.log("created= ",created);
    // navigate(`/workspaces/${created._id}`);
    navigate(`/dashboard/`);

    toast.success('Workspace created successfully');
    reset(); toggleModal(); setIsCreatingWorkspace(false);
  } catch (err) {
    const msg = err?.response?.data?.message || 'Something went wrong';
    toast.error(msg);
  }
};


  return (
    <>
      {isCreatingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Light overlay with blur effect */}
          <div 
            className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/50"
            onClick={toggleModal}
          />
          
          {/* Modal container with proper max-height */}
          <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] bg-white rounded-lg shadow-xl dark:bg-gray-800 overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Workspace
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                onClick={toggleModal}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
             
                <InputField
                    label="Workspace Name"
                    name="WorkspaceName"
                    type="text"
                    register={register}
                    errors={errors}
                    placeholder="Type workspace name"
                    required
                    />
                <TextareaInputField
                    label="Description (Optional)"
                    name="WorkspaceDescription"
                    type="text"
                    register={register}
                    errors={errors}
                    placeholder="Write workspace description here"
                    required
                    />
              

 <div className="space-y-2">
            <label className="block text-sm font-medium">Workspace Color</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setValue("WorkspaceColor", color.hex)}
                  className={`w-8 h-8 rounded-full transition-all ${color.lightClass} dark:${color.darkClass} ${
                    selectedColorHex === color.hex ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-green-600' : ''
                  }`}
                  title={color.name}
                />
              ))}
            </div>
            <input type="hidden" {...register("WorkspaceColor")} />
             {errors.WorkspaceColor && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">Color selection is required</p>
                )}
          </div>

              <div className="sticky bottom-0 z-10 flex justify-end pt-4 pb-2 bg-white dark:bg-gray-800">
            
                    <Button type="submit" isLoading={isSubmitting || isPending}>
                        Create Workspace
                    </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateWorkspace;





















// import { useState } from 'react';

// const CreateWorkspace = ({ isCreatingWorkspace, setIsCreatingWorkspace }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     description: ''
//   });

//   const toggleModal = () => {
//     setIsCreatingWorkspace(!isCreatingWorkspace);
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log("New workspace created:", formData);
//     toggleModal();
//   };

//   return (
//     <>
//       {isCreatingWorkspace && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           {/* Light overlay with blur effect */}
//           <div 
//             className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/50"
//             onClick={toggleModal}
//           />
          
//           {/* Modal container */}
//           <div className="relative mx-4 w-full max-w-lg bg-white rounded-lg shadow-xl dark:bg-gray-800">
//             {/* Modal header */}
//             <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
//               <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
//                 Create New Workspace
//               </h3>
//               <button
//                 type="button"
//                 className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
//                 onClick={toggleModal}
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             {/* Modal body */}
//             <form className="p-6 space-y-4" onSubmit={handleSubmit}>
//               <div>
//                 <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                   Workspace Name
//                 </label>
//                 <input
//                   type="text"
//                   name="name"
//                   id="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//                   placeholder="Type workspace name"
//                   required
//                 />
//               </div>
              
//               <div>
//                 <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                   Description (Optional)
//                 </label>
//                 <textarea
//                   id="description"
//                   name="description"
//                   rows="4"
//                   value={formData.description}
//                   onChange={handleChange}
//                   className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//                   placeholder="Write workspace description here"
//                 />
//               </div>

//               <div className="flex justify-end pt-4">
//                 <button
//                   type="submit"
//                   className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   Create Workspace
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default CreateWorkspace;