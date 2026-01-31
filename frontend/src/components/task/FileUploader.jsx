// src/components/task/FileUploader.jsx
import React, { useEffect, useRef, useState } from "react";
import { AiOutlineDelete } from "react-icons/ai";
import { GlobalWorkerOptions } from "pdfjs-dist";
import PDFPreview from "./PDFPreview.jsx";
// import { useDeleteTaskFile } from "../../hooks/useTaskFileService.ts"; // CHANGE: remove backend delete here

export default function FileUploader({
  onChange,          // optional: parent setter e.g. setFileUrls
  fileUrls,          // external list (create/edit)
  setFileUrls,       // external setter
  taskId,
  isEditMode,
  resetFlag,
}) {
  const [previewFiles, setPreviewFiles] = useState([]);
  const scrollContainerRef = useRef(null);
  // const deleteTaskFile = useDeleteTaskFile(); // CHANGE: not needed now

  useEffect(() => {
    try {
      GlobalWorkerOptions.workerSrc = "pdf.worker.mjs";
    } catch {
      // ignore
    }
  }, []);

  // edit mode: server se aayi urls ko preview me dikhao
  useEffect(() => {
    if (isEditMode && Array.isArray(fileUrls)) {
      setPreviewFiles(
        fileUrls.map((u) => ({
          fileUrl: u.fileUrl,
          fileName: u.fileName,
          fileType: u.fileType,
          fileSize: u.fileSize,
        }))
      );
    }
  }, [isEditMode, fileUrls]);

  // reset
  useEffect(() => {
    if (resetFlag && !isEditMode) {
      setPreviewFiles([]);
      setFileUrls?.([]);
      onChange?.([]);
    }
  }, [resetFlag, isEditMode, onChange, setFileUrls]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const valid = selected.filter((f) => validTypes.includes(f.type));

    const newFiles = valid.map((file) => ({
      fileUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileType: file.type,
      file,
      size: file.size, // CHANGE: keep size for de-dupe if needed by parent
    }));

    setPreviewFiles((prev) => [...prev, ...newFiles]);
    setFileUrls?.((prev) => [...(prev || []), ...newFiles]);
    onChange?.((prev) => [...(Array.isArray(prev) ? prev : []), ...newFiles]);
  };

  // CHANGE: Edit mode me delete button ab sirf UI/state se hatata hai (backend call NAHI)
  const handledeleteTaskFile = async (fileName, fileUrl) => {
    try {
      // if (isEditMode && taskId && fileName) {
      //   await deleteTaskFile({ taskId, fileName }).unwrap();
      // }

      // UI/state se remove karo
      setPreviewFiles((prev) => prev.filter((f) => f.fileUrl !== fileUrl));
      setFileUrls?.((prev) => (prev || []).filter((f) => f.fileUrl !== fileUrl));
      onChange?.((prev) =>
        Array.isArray(prev) ? prev.filter((f) => f.fileUrl !== fileUrl) : prev
      );

      try {
        // local blob URL cleanup (hosted URLs pe safe hai, fail ho to ignore)
        URL.revokeObjectURL(fileUrl);
      } catch {
        // ignore
      }
    } catch (err) {
      console.error("Error deleting file (UI state only now):", err);
    }
  };

  const renderFilePreview = (file) => {
    switch (file.fileType) {
      case "application/pdf":
        return (
          <div className="w-full h-full">
            <PDFPreview file={file} />
          </div>
        );
      case "image/jpeg":
      case "image/jpg":
      case "image/png":
      case "image/gif":
        return (
          <img
            src={file.fileUrl}
            alt={file.fileName}
            className="w-full h-full object-fill"
          />
        );
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "application/vnd.ms-excel":
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <p className="text-xs">Preview not available</p>
          </div>
        );
      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <p className="text-xs">File type not supported</p>
          </div>
        );
    }
  };

  // drag to scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    let isDown = false,
      startX = 0,
      scrollLeft = 0;
    const down = (e) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const leave = () => (isDown = false);
    const up = () => (isDown = false);
    const move = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft - (x - startX) * 2;
    };
    el.addEventListener("mousedown", down);
    el.addEventListener("mouseleave", leave);
    el.addEventListener("mouseup", up);
    el.addEventListener("mousemove", move);
    return () => {
      el.removeEventListener("mousedown", down);
      el.removeEventListener("mouseleave", leave);
      el.removeEventListener("mouseup", up);
      el.removeEventListener("mousemove", move);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <label
        htmlFor={isEditMode ? "edit-task-file" : "add-task-file"}
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 "
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Accepts PDF, Images, Word, Excel
          </p>
        </div>
        <input
          id={isEditMode ? "edit-task-file" : "add-task-file"}
          type="file"
          className="hidden"
          multiple
          onChange={handleFileChange}
          accept=".pdf,.jpeg,.jpg,.png,.gif,.doc,.docx,.xls,.xlsx"
        />
      </label>

      <div
        ref={scrollContainerRef}
        className="flex flex-nowrap mt-4 overflow-x-auto w-full"
        style={{ cursor: "grab" }}
      >
        {previewFiles.length > 0 && (
          <div className="flex space-x-4">
            {previewFiles.map((file, idx) => (
              <div
                key={idx}
                className="relative w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => window.open(file.fileUrl, "_blank")}
              >
                {renderFilePreview(file)}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handledeleteTaskFile(file.fileName, file.fileUrl);
                  }}
                  className="absolute top-0 right-0 p-1 m-2 bg-red-500 text-white rounded-full"
                  aria-label="Delete"
                >
                  <AiOutlineDelete size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

































// import React, { useState, useRef, useEffect } from 'react';
// import { pdfjs, Document, Page } from 'react-pdf';
// import { AiOutlineDelete } from 'react-icons/ai';

// // Use a CDN for the PDF worker if serving locally causes issues
// pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.12.313/build/pdf.worker.min.js'; 

// export default function FileUploader({ fileUrls, setFileUrls, taskId, isEditMode, resetFlag }) {
//   const [pdfError, setPdfError] = useState('');
//   const [previewFiles, setPreviewFiles] = useState([]);
//   const scrollContainerRef = useRef(null);

//   // useEffect(() => {
//   //   if (isEditMode && taskId) {
//   //     // Simulate fetching files from server if needed
//   //     // Example: setPreviewFiles(fileUrls);
//   //     setPreviewFiles(fileUrls); // Initialize with existing files
//   //   }
    
//   // }, [isEditMode, taskId, fileUrls]);


//   // useEffect(() => {
//   //   if (isEditMode && taskId) {
//   //     // Log fileUrls and prevFiles to debug
//   //     console.log("Existing Files:", previewFiles);
//   //     console.log("New File URLs:", fileUrls);

//   //     setPreviewFiles(prevFiles => {
//   //       if (!fileUrls || fileUrls.length === 0) return prevFiles;

//   //       // Create a map of existing files
//   //       const fileUrlsMap = new Map(prevFiles.map(file => [file.fileUrl, file]));

//   //       // Add new fileUrls to the map if they are not already present
//   //       fileUrls.forEach(file => {
//   //         if (!fileUrlsMap.has(file.fileUrl)) {
//   //           fileUrlsMap.set(file.fileUrl, file);
//   //         }
//   //       });

//   //       // Return updated files array
//   //       return Array.from(fileUrlsMap.values());
//   //     });
//   //   }
//   // }, [isEditMode, taskId, fileUrls]);


//    // Initialize preview files with fileUrls from backend
//    useEffect(() => {
//     if (isEditMode && taskId && fileUrls.length > 0) {
//       console.log("Initializing with backend files", fileUrls);
//       setPreviewFiles(fileUrls);
//     }
//   }, [isEditMode, taskId, fileUrls]);

 
//   useEffect(() => {
//     if (resetFlag && !isEditMode) {
//       setPreviewFiles([]);
//       setFileUrls([]); // Also clear the teamAssignee state
//     }
//   }, [resetFlag, isEditMode]);

//   const handleFileChange = (event) => {
//     const selectedFiles = Array.from(event.target.files);

//     const validTypes = [
//       'application/pdf', 'image/jpeg', 'image/png', 'image/gif',
//       'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     ];

//     const validFiles = selectedFiles.filter(file => validTypes.includes(file.type));
//     // const validFiles = selectedFiles.filter(file => 
//     //   validTypes.includes(file.type) && file.size <= MAX_FILE_SIZE_MB * 1024 * 1024
//     // );


//     const newFiles = validFiles.map(file => ({
//       fileUrl: URL.createObjectURL(file),
//       fileName: file.name,
//       fileType: file.type,
//       file,
//     }));

//     setPreviewFiles(prevFiles => [...prevFiles, ...newFiles]);
//     setFileUrls(prevFiles => [...prevFiles, ...newFiles]);
//   };

//   const handleFileClick = (fileUrl) => {
//     window.open(fileUrl, '_blank');
//   };

//   const handledeleteTaskFile = (fileUrl) => {
//     setPreviewFiles(prevFiles => prevFiles.filter(file => file.fileUrl !== fileUrl));
//     setFileUrls(prevFiles => prevFiles.filter(file => file.fileUrl !== fileUrl));
//     URL.revokeObjectURL(fileUrl); // Clean up object URL
//   };

  



//   const renderFilePreview = (file) => {
//     switch (file.fileType) {
//       case 'application/pdf':
//         return (
//           <div style={{ width: '100%', height: '100%' }} className='w-full h-full'>
//             <Document
//               file={file.fileUrl}
//               onLoadError={(error) => setPdfError(error.message || 'Error loading PDF')}
//               onLoadSuccess={() => setPdfError('')}
//             >
//               <Page pageNumber={1} width={132} />
//               <Page pageNumber={2} width={132} />
//             </Document>
//             {pdfError && <div className="text-red-500">{pdfError}</div>}
//           </div>
//         );
//       case 'image/jpeg':
//       case 'image/jpg':
//       case 'image/png':
//       case 'image/gif':
//         return <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-fill" />;
//       case 'application/msword':
//       case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
//       case 'application/vnd.ms-excel':
//       case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
//         return (
//           <div className="w-full h-full flex items-center justify-center text-gray-500">
//             <p className="text-xs">Preview not available</p>
//           </div>
//         );
//       default:
//         return (
//           <div className="w-full h-full flex items-center justify-center text-gray-500">
//             <p className="text-xs">File type not supported</p>
//           </div>
//         );
//     }
//   };

//   // Drag-to-scroll functionality
//   useEffect(() => {
//     const container = scrollContainerRef.current;
//     let isDown = false;
//     let startX;
//     let scrollLeft;

//     const mouseDownHandler = (e) => {
//       isDown = true;
//       container.classList.add('active');
//       startX = e.pageX - container.offsetLeft;
//       scrollLeft = container.scrollLeft;
//     };

//     const mouseLeaveHandler = () => {
//       isDown = false;
//       container.classList.remove('active');
//     };

//     const mouseUpHandler = () => {
//       isDown = false;
//       container.classList.remove('active');
//     };

//     const mouseMoveHandler = (e) => {
//       if (!isDown) return;
//       e.preventDefault();
//       const x = e.pageX - container.offsetLeft;
//       const walk = (x - startX) * 2; // Scroll-fast
//       container.scrollLeft = scrollLeft - walk;
//     };

//     container.addEventListener('mousedown', mouseDownHandler);
//     container.addEventListener('mouseleave', mouseLeaveHandler);
//     container.addEventListener('mouseup', mouseUpHandler);
//     container.addEventListener('mousemove', mouseMoveHandler);

//     return () => {
//       container.removeEventListener('mousedown', mouseDownHandler);
//       container.removeEventListener('mouseleave', mouseLeaveHandler);
//       container.removeEventListener('mouseup', mouseUpHandler);
//       container.removeEventListener('mousemove', mouseMoveHandler);
//     };
//   }, []);

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span>
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             Accepts PDF, Images, Word, Excel
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//           accept=".pdf, .jpeg, .jpg, .png, .gif, .doc, .docx, .xls, .xlsx"
//         />
//       </label>

//       {/* Preview Section */}
//       <div
//         ref={scrollContainerRef}
//         className="flex flex-nowrap mt-4 overflow-x-auto w-full cursor-grab"
//         style={{ cursor: 'grab' }}
//       >
//         {previewFiles.length > 0 && (
//           <div className="flex space-x-4">
//             {previewFiles.map((file, index) => (
//               <div
//                 key={index}
//                 className="relative w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
//                 style={{ cursor: 'pointer' }}
//                 onClick={() => handleFileClick(file.fileUrl)} // Open file in new tab
//               >
//                 {renderFilePreview(file)}
//                 <button
//                 type="button"
//                   onClick={(e) => {
//                     e.stopPropagation(); // Prevent the parent click handler
//                     e.preventDefault();
//                     handledeleteTaskFile(file.fileUrl);
//                   }}
//                   className="absolute top-0 right-0 p-1 m-2 bg-red-500 text-white rounded-full"
//                   aria-label="Delete"
//                 >
//                   <AiOutlineDelete size={20} />
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

























// import React, { useState, useRef, useEffect } from 'react';
// import { pdfjs, Document, Page } from 'react-pdf';
// import axios from 'axios';
// import { AiOutlineDelete } from 'react-icons/ai';
// import { useGetTaskFileQuery, useUploadTaskFileMutation, useDeleteTaskFileMutation } from '../../redux/slices/api/taskFileApiSlice';

// // Use a CDN for the PDF worker if serving locally causes issues
// pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.12.313/build/pdf.worker.min.js'; 

// export default function FileUploader({ fileUrls, setFileUrls, taskId, isEditMode }) {
//   // const [fileUrls, setFileUrls] = useState([]);
//   const [pdfError, setPdfError] = useState('');
//   const scrollContainerRef = useRef(null);

//   const { data: taskFiles = [], isLoading } = useGetTaskFileQuery(taskId, { skip: !isEditMode }); // Updated API hook
//   const [uploadFile] = useUploadTaskFileMutation();
//   const [deleteTaskFile] = useDeleteTaskFileMutation();
 

//   useEffect(() => {
//     if (isEditMode && taskId && taskFiles.length > 0) {
//       setFileUrls(taskFiles); // Update file URLs when in edit mode
//     }
//   }, [isEditMode, taskId, taskFiles, setFileUrls]);


//   useEffect(() => {
//     // Handle changes to taskId (e.g., if it becomes available later)
//     if (!isEditMode && taskId) {
//       setFileUrls([]);
//     }
//   }, [taskId, isEditMode, setFileUrls]);







  
//   const handleFileChange = async (event) => {

//     if (!taskId) {
//       console.error("Task ID is required for uploading files.");
//       return;
//     }
//     const selectedFiles = Array.from(event.target.files);
  
//     const validTypes = [
//       'application/pdf', 'image/jpeg', 'image/png', 'image/gif',
//       'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     ];
  
//     const validFiles = selectedFiles.filter(file => validTypes.includes(file.type));
  
//     for (let file of validFiles) {
//       const formData = new FormData();
//       formData.append('file', file);
//       formData.append('taskId', taskId);
//       try {
//         // const response = await axios.post('http://localhost:4000/api/boards/tasks/files/upload', formData, {
//         //   headers: {
//         //     'Content-Type': 'multipart/form-data',
//         //   },
//         //   withCredentials: true,
//         // });
  
//         // const uploadedFile = response.data.file;

//         const response = await uploadFile({ formData, taskId }).unwrap(); // Updated API call
//         const uploadedFile = response.file;


//         if (uploadedFile) {
//           // const fileUrl = `http://localhost:4000/api/boards/tasks/files/${uploadedFile.filename}`;
//           const fileUrl = `http://localhost:4000/api/taskFile/tasks/files/${taskId}/${uploadedFile.filename}`;  // Updated file URL

//           console.log("fileUrl= ",fileUrl)
//           // const  fileUrl  =  useGetTaskFileQuery(uploadedFile.filename);

//           setFileUrls(prevFileUrls => [
//             ...prevFileUrls,
//             {
//               fileUrl,
//               fileName: uploadedFile.originalname,  // Display name
//               generatedFileName: uploadedFile.filename, // For operations
//               fileType: file.type,
//             },
//           ]);
//         } 
//         else {
//           console.error('Uploaded file data not found in response.');
//         }
//       } catch (error) {
//         console.error('Error uploading file:', error);
//       }
//     }
//   };
  

//   const handleFileClick = (fileUrl) => {
//     window.open(fileUrl, '_blank');
//   };

//   const handledeleteTaskFile = async (generatedFileName) => {
//     try {
//       // await axios.delete(`http://localhost:4000/api/boards/tasks/files/${generatedFileName}`, {
//       //   withCredentials: true,
//       // });
      
//       // await deleteTaskFile({ fileName: generatedFileName }).unwrap();
//      await deleteTaskFile({ taskId, fileName: generatedFileName }).unwrap();
//       // Update state to remove the deleted file
//       setFileUrls(prevFileUrls => prevFileUrls.filter(file => file.generatedFileName !== generatedFileName));
     
//     } catch (error) {
//       console.error('Error deleting file:', error);
//     }
//   };
  


//   const renderFilePreview = (file) => {


//     switch (file.fileType) {
//       case 'application/pdf':
//         return (
//           <div style={{ width: '100%', height: '100%' }} className='w-full h-full'>
//             <Document
//               file={file.fileUrl}
//               onLoadError={(error) => setPdfError(error.message || 'Error loading PDF')}
//               onLoadSuccess={() => setPdfError('')}
//             >
//               <Page pageNumber={1} width={132} />
//               <Page pageNumber={2} width={132} />
//             </Document>
//             {pdfError && <div className="text-red-500">{pdfError}</div>}
//           </div>
//         );
//       case 'image/jpeg':
//       case 'image/jpg':
//       case 'image/png':
//       case 'image/gif':
        
//         return <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-fill" />;
//       case 'application/msword':
//       case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
//       case 'application/vnd.ms-excel':
//       case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
//         return (
//           <div className="w-full h-full flex items-center justify-center text-gray-500">
//             <p className="text-xs">Preview not available</p>
//           </div>
//         );
//       default:
//         return (
//           <div className="w-full h-full flex items-center justify-center text-gray-500">
//             <p className="text-xs">File type not supported</p>
//           </div>
//         );
//     }
//   };

//   // Drag-to-scroll functionality
//   useEffect(() => {
//     const container = scrollContainerRef.current;
//     let isDown = false;
//     let startX;
//     let scrollLeft;

//     const mouseDownHandler = (e) => {
//       isDown = true;
//       container.classList.add('active');
//       startX = e.pageX - container.offsetLeft;
//       scrollLeft = container.scrollLeft;
//     };

//     const mouseLeaveHandler = () => {
//       isDown = false;
//       container.classList.remove('active');
//     };

//     const mouseUpHandler = () => {
//       isDown = false;
//       container.classList.remove('active');
//     };

//     const mouseMoveHandler = (e) => {
//       if (!isDown) return;
//       e.preventDefault();
//       const x = e.pageX - container.offsetLeft;
//       const walk = (x - startX) * 2; // Scroll-fast
//       container.scrollLeft = scrollLeft - walk;
//     };

//     container.addEventListener('mousedown', mouseDownHandler);
//     container.addEventListener('mouseleave', mouseLeaveHandler);
//     container.addEventListener('mouseup', mouseUpHandler);
//     container.addEventListener('mousemove', mouseMoveHandler);

//     return () => {
//       container.removeEventListener('mousedown', mouseDownHandler);
//       container.removeEventListener('mouseleave', mouseLeaveHandler);
//       container.removeEventListener('mouseup', mouseUpHandler);
//       container.removeEventListener('mousemove', mouseMoveHandler);
//     };
//   }, []);

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span>
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             Accepts PDF, Images, Word, Excel
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//           accept=".pdf, .jpeg, .jpg, .png, .gif, .doc, .docx, .xls, .xlsx"
//         />
//       </label>

//       {/* Preview Section */}
//       <div
//         ref={scrollContainerRef}
//         className="flex flex-nowrap mt-4 overflow-x-auto w-full cursor-grab"
//         style={{ cursor: 'grab' }}
//       >
//         {fileUrls.length > 0 && (
//           <div className="flex space-x-4">
//             {fileUrls.map((file, index) => (
//               <div
//                 key={index}
//                 className="relative w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
//                 style={{ cursor: 'pointer' }}
//                 onClick={() => handleFileClick(file.fileUrl)} // Open file in new tab
//               >
//                 {renderFilePreview(file)}
//                 {console.log("file= ",fileUrls)}
//                 <button
//                    onClick={(e) => {
//                     e.stopPropagation(); // Prevent the parent click handler
//                     {isEditMode? handledeleteTaskFile(file.fileName) :  handledeleteTaskFile(file.generatedFileName);}
//                     // handledeleteTaskFile(file.fileName);
//                   }}
//                   className="absolute top-0 right-0 p-1 m-2 bg-red-500 text-white rounded-full"
//                   aria-label="Delete"
//                 >
//                   <AiOutlineDelete size={20} />
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }























// import React, { useState, useRef, useEffect } from 'react';
// import { pdfjs, Document, Page } from 'react-pdf';
// import axios from 'axios';

// // Use a CDN for the PDF worker if serving locally causes issues
// pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.12.313/build/pdf.worker.min.js'; 

// export default function FileUploader() {
//   const [fileUrls, setFileUrls] = useState([]);
//   const [pdfError, setPdfError] = useState('');
//   const scrollContainerRef = useRef(null);

//   const handleFileChange = async (event) => {
//     const selectedFiles = Array.from(event.target.files);

//     const validTypes = [
//       'application/pdf', 'image/jpeg', 'image/png', 'image/gif',
//       'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     ];

//     const validFiles = selectedFiles.filter(file => validTypes.includes(file.type));

//     for (let file of validFiles) {
//       const formData = new FormData();
//       formData.append('file', file);

//       try {
//         const response = await axios.post('http://localhost:4000/api/boards/tasks/files/upload', formData, {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           },
//           withCredentials: true,
//         });

//         const uploadedFile = response.data.file;
//         if (uploadedFile) {
//           const fileUrl = `http://localhost:4000/api/boards/tasks/files/${uploadedFile.filename}`;
//           setFileUrls(prevFileUrls => [
//             ...prevFileUrls,
//             { fileUrl, fileName: file.name, fileType: file.type },
//           ]);
//         } else {
//           console.error('Uploaded file data not found in response.');
//         }
//       } catch (error) {
//         console.error('Error uploading file:', error);
//       }
//     }
//   };

//   const handleFileClick = (fileUrl) => {
//     window.open(fileUrl, '_blank');
//   };

//   const renderFilePreview = (file) => {
//     switch (file.fileType) {
//       case 'application/pdf':
//         return (
//           <div style={{ width: '100%', height: '100%' }} className='w-full h-full'>
//             <Document
//               file={file.fileUrl}
//               onLoadError={(error) => setPdfError(error.message || 'Error loading PDF')}
//               onLoadSuccess={() => setPdfError('')}
//             >
//               <Page pageNumber={1} width={132} />
//               <Page pageNumber={2} width={132} />
//             </Document>
//             {pdfError && <div className="text-red-500">{pdfError}</div>}
//           </div>
//         );
//       case 'image/jpeg':
//       case 'image/png':
//       case 'image/gif':
//         return <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-fill" />;
//       case 'application/msword':
//       case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
//       case 'application/vnd.ms-excel':
//       case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
//         return (
//           <div className="w-full h-full flex items-center justify-center text-gray-500">
//             <p className="text-xs">Preview not available</p>
//           </div>
//         );
//       default:
//         return (
//           <div className="w-full h-full flex items-center justify-center text-gray-500">
//             <p className="text-xs">File type not supported</p>
//           </div>
//         );
//     }
//   };

//   // Drag-to-scroll functionality
//   useEffect(() => {
//     const container = scrollContainerRef.current;
//     let isDown = false;
//     let startX;
//     let scrollLeft;

//     const mouseDownHandler = (e) => {
//       isDown = true;
//       container.classList.add('active');
//       startX = e.pageX - container.offsetLeft;
//       scrollLeft = container.scrollLeft;
//     };

//     const mouseLeaveHandler = () => {
//       isDown = false;
//       container.classList.remove('active');
//     };

//     const mouseUpHandler = () => {
//       isDown = false;
//       container.classList.remove('active');
//     };

//     const mouseMoveHandler = (e) => {
//       if (!isDown) return;
//       e.preventDefault();
//       const x = e.pageX - container.offsetLeft;
//       const walk = (x - startX) * 2; // Scroll-fast
//       container.scrollLeft = scrollLeft - walk;
//     };

//     container.addEventListener('mousedown', mouseDownHandler);
//     container.addEventListener('mouseleave', mouseLeaveHandler);
//     container.addEventListener('mouseup', mouseUpHandler);
//     container.addEventListener('mousemove', mouseMoveHandler);

//     return () => {
//       container.removeEventListener('mousedown', mouseDownHandler);
//       container.removeEventListener('mouseleave', mouseLeaveHandler);
//       container.removeEventListener('mouseup', mouseUpHandler);
//       container.removeEventListener('mousemove', mouseMoveHandler);
//     };
//   }, []);

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span>
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             Accepts PDF, Images, Word, Excel
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//           accept=".pdf, .jpeg, .jpg, .png, .gif, .doc, .docx, .xls, .xlsx"
//         />
//       </label>

//       {/* Preview Section */}
//       <div
//         ref={scrollContainerRef}
//         className="flex flex-nowrap mt-4 overflow-x-auto w-full cursor-grab"
//         style={{ cursor: 'grab' }}
//       >
//         {fileUrls.length > 0 && (
//           <div className="flex space-x-4">
//             {fileUrls.map((file, index) => (
//               <div
//                 key={index}
//                 className="relative w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden "
//                 onClick={() => handleFileClick(file.fileUrl)}
//                 style={{ cursor: 'pointer' }}
//               >
//                 {renderFilePreview(file)}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }






















// import React, { useState } from 'react';
// import { pdfjs, Document, Page } from 'react-pdf';
// import axios from 'axios';

// // Use a CDN for the PDF worker if serving locally causes issues
// pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.12.313/build/pdf.worker.min.js'; 

// export default function FileUploader() {
//   const [fileUrls, setFileUrls] = useState([]);
//   const [pdfError, setPdfError] = useState('');

//   const handleFileChange = async (event) => {
//     const selectedFiles = Array.from(event.target.files);

//     // Adjust valid types to include all types for which you need previews
//     const validTypes = [
//       'application/pdf', 'image/jpeg', 'image/png', 'image/gif',
//       'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     ];

//     const validFiles = selectedFiles.filter(file => validTypes.includes(file.type));

//     for (let file of validFiles) {
//       const formData = new FormData();
//       formData.append('file', file);

//       try {
//         const response = await axios.post('http://localhost:4000/api/boards/tasks/files/upload', formData, {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           },
//           withCredentials: true,
//         });

//         const uploadedFile = response.data.file;
//         if (uploadedFile) {
//           const fileUrl = `http://localhost:4000/api/boards/tasks/files/${uploadedFile.filename}`;
//           setFileUrls(prevFileUrls => [
//             ...prevFileUrls,
//             { fileUrl, fileName: file.name, fileType: file.type },
//           ]);
//         } else {
//           console.error('Uploaded file data not found in response.');
//         }
//       } catch (error) {
//         console.error('Error uploading file:', error);
//       }
//     }
//   };

//   const handleFileClick = (fileUrl) => {
//     window.open(fileUrl, '_blank');
//   };

//   const renderFilePreview = (file) => {
//     switch (file.fileType) {
//       case 'application/pdf':
//         return (
//           <div style={{ width: '100%', height: '100%' }}>
//             <Document
//               file={file.fileUrl}
//               onLoadError={(error) => setPdfError(error.message || 'Error loading PDF')}
//               onLoadSuccess={() => setPdfError('')}
//             >
//               <Page pageNumber={1} width={320} />
//             </Document>
//             {pdfError && <div className="text-red-500">{pdfError}</div>}
//           </div>
//         );
//       case 'image/jpeg':
//       case 'image/png':
//       case 'image/gif':
//         return <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-contain" />;
//       case 'application/msword':
//       case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
//       case 'application/vnd.ms-excel':
//       case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
//         return (
//           <div className="w-full h-full flex items-center justify-center text-gray-500">
//             <p className="text-xs">Preview not available</p>
//           </div>
//         );
//       default:
//         return (
//           <div className="w-full h-full flex items-center justify-center text-gray-500">
//             <p className="text-xs">File type not supported</p>
//           </div>
//         );
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span>
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             Accepts PDF, Images, Word, Excel
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//           accept=".pdf, .jpeg, .jpg, .png, .gif, .doc, .docx, .xls, .xlsx"
//         />
//       </label>

//       {/* Preview Section */}
//       <div className="flex flex-nowrap mt-4 overflow-x-auto w-full" style={{ cursor: 'grab' }}>
//         {fileUrls.length > 0 && (
//           <div className="flex space-x-4 w-full">
//             {fileUrls.map((file, index) => (
//               <div
//                 key={index}
//                 className="relative w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
//                 onClick={() => handleFileClick(file.fileUrl)}
//                 style={{ cursor: 'pointer' }}
//               >
//                 {renderFilePreview(file)}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
























// import React, { useState } from 'react';
// import { pdfjs, Document, Page } from 'react-pdf';
// import axios from 'axios';

// // Use a CDN for the PDF worker if serving locally causes issues
// pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.12.313/build/pdf.worker.min.js'; 

// export default function FileUploader() {
//   const [fileUrls, setFileUrls] = useState([]);
//   const [pdfError, setPdfError] = useState('');

//   const handleFileChange = async (event) => {
//     const selectedFiles = Array.from(event.target.files);
//     const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

//     const validFiles = selectedFiles.filter(file => validTypes.includes(file.type));

//     for (let file of validFiles) {
//       const formData = new FormData();
//       formData.append('file', file);

//       try {
//         const response = await axios.post('http://localhost:4000/api/boards/tasks/files/upload', formData, {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           },
//           withCredentials: true,
//         });

//         const uploadedFile = response.data.file;
//         if (uploadedFile) {
//           const fileUrl = `http://localhost:4000/api/boards/tasks/files/${uploadedFile.filename}`;
//           setFileUrls(prevFileUrls => [
//             ...prevFileUrls,
//             { fileUrl, fileName: file.name, fileType: file.type },
//           ]);
//         } else {
//           console.error('Uploaded file data not found in response.');
//         }
//       } catch (error) {
//         console.error('Error uploading file:', error);
//       }
//     }
//   };

//   const handleFileClick = (fileUrl) => {
//     window.open(fileUrl, '_blank');
//   };

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span>
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             Accepts PDF, Images
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//           accept=".pdf, .jpeg, .png, .gif"
//         />
//       </label>

//       {/* Preview Section */}
//       <div className="flex flex-nowrap mt-4 overflow-x-auto w-full" style={{ cursor: 'grab' }}>
//         {fileUrls.length > 0 && (
//           <div className="flex space-x-4 w-full">
//             {fileUrls.map((file, index) => (
//               <div
//                 key={index}
//                 className="relative w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
//                 onClick={() => handleFileClick(file.fileUrl)}
//                 style={{ cursor: 'pointer' }}
//               >
//                 {file.fileType === 'application/pdf' ? (
//                   <div style={{ width: '100%', height: '100%' }}>
//                     <Document
//                       file={file.fileUrl}
//                       onLoadError={(error) => setPdfError(error.message || 'Error loading PDF')}
//                       onLoadSuccess={() => setPdfError('')}
//                     >
//                       <Page pageNumber={1} width={320} />
//                     </Document>
//                     {pdfError && <div className="text-red-500">{pdfError}</div>}
//                   </div>
//                 ) : file.fileType.startsWith('image/') ? (
//                   <img
//                     src={file.fileUrl}
//                     alt={file.fileName}
//                     className="w-full h-full object-contain"
//                   />
//                 ) : (
//                   <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       strokeWidth={1.5}
//                       stroke="currentColor"
//                       className="w-8 h-8"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         d="M19.5 9.75a7.5 7.5 0 0 0-15 0v4.5a7.5 7.5 0 0 0 15 0v-4.5z"
//                       />
//                     </svg>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }




































// import React, { useState } from 'react';
// import axios from 'axios';

// export default function FileUploader() {
//   const [fileUrls, setFileUrls] = useState([]);

//   const handleFileChange = async (event) => {
//     const selectedFiles = Array.from(event.target.files);
//     const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

//     // Filter out invalid file types
//     const validFiles = selectedFiles.filter(file => validTypes.includes(file.type));

//     // Upload valid files to the server
//     for (let file of validFiles) {
//       const formData = new FormData();
//       formData.append('file', file);

//       try {
//         const response = await axios.post('http://localhost:4000/api/boards/tasks/files/upload', formData, {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           },
//           withCredentials: true,
//         });

//         const uploadedFile = response.data.file;
//         if (uploadedFile) {
//           const fileUrl = `http://localhost:4000/api/boards/tasks/files/${uploadedFile.filename}`;

//           setFileUrls(prevFileUrls => [
//             ...prevFileUrls,
//             { fileUrl, fileName: file.name, fileType: file.type },
//           ]);
//         } else {
//           console.error('Uploaded file data not found in response.');
//         }
//       } catch (error) {
//         console.error('Error uploading file:', error);
//       }
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <svg
//             className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
//             aria-hidden="true"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 20 16"
//           >
//             <path
//               stroke="currentColor"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
//             />
//           </svg>
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span>
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             Only PNG, JPG, GIF, and PDF are allowed
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//           accept=".png, .jpg, .jpeg, .gif, .pdf"
//         />
//       </label>

//       {/* Preview Section */}
//       <div className="flex flex-nowrap mt-4 overflow-x-auto w-full" style={{ cursor: 'grab' }}>
//         {fileUrls.length > 0 && (
//           <div className="flex space-x-4 w-full">
//             {fileUrls.map((file, index) => (
//               <div
//                 key={index}
//                 className="relative w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
//               >
//                 {file.fileType.startsWith('image/') ? (
//                   <img
//                     src={file.fileUrl}
//                     alt={file.fileName}
//                     className="object-cover w-full h-full"
//                   />
//                 ) : (
//                   <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       strokeWidth={1.5}
//                       stroke="currentColor"
//                       className="w-8 h-8"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         d="M19.5 8.25v10.5c0 .621-.504 1.125-1.125 1.125H5.625c-.621 0-1.125-.504-1.125-1.125V5.625c0-.621.504-1.125 1.125-1.125h7.239a1.125 1.125 0 0 1 .797.33l5.484 5.235a1.125 1.125 0 0 1 .33.797z"
//                       />
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         d="M11.25 4.5v6.75h6.75"
//                       />
//                     </svg>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }




























// import React, { useState, useEffect, useRef } from 'react';


// FileUploader.defaultProps = {
//   fileUrls: [],
//   setFileUrls: () => {},
// };

// export default function FileUploader({fileUrls, setFileUrls }) {
// //   const [fileUrls, setFileUrls] = useState([]);
//   const urlsRef = useRef([]);

//   // Handle file selection
//   const handleFileChange = (event) => {
//     const selectedFiles = Array.from(event.target.files);
//     const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

//     // Filter out invalid file types
//     const validFiles = selectedFiles.filter(file => validTypes.includes(file.type));

//     // Generate URLs for valid files
//     const newFileUrls = validFiles.map(file => {
//       const fileUrl = URL.createObjectURL(file);
//       return { fileUrl, fileName: file.name, fileType: file.type };
//     });

//     // Update URLs and ref
//     setFileUrls(prevFileUrls => [...prevFileUrls, ...newFileUrls]);
//     urlsRef.current = [...urlsRef.current, ...newFileUrls.map(file => file.url)];

//   };

//   // Cleanup URLs when component unmounts or fileUrls change
//   useEffect(() => {
//     return () => {
//       urlsRef.current.forEach(url => URL.revokeObjectURL(url));
//     };
//   }, []);

//   const handleClick = (url) => {
//     window.open(url, '_blank', 'noopener,noreferrer');
//   };

//   const handleMouseDown = (e, containerRef) => {
//     const container = containerRef.current;
//     const startX = e.pageX;
//     const scrollLeft = container.scrollLeft;

//     const handleMouseMove = (e) => {
//       const dx = e.pageX - startX;
//       container.scrollLeft = scrollLeft - dx;
//     };

//     const handleMouseUp = () => {
//       document.removeEventListener('mousemove', handleMouseMove);
//       document.removeEventListener('mouseup', handleMouseUp);
//     };

//     document.addEventListener('mousemove', handleMouseMove);
//     document.addEventListener('mouseup', handleMouseUp);
//   };

//   const containerRef = useRef(null);

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <svg
//             className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
//             aria-hidden="true"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 20 16"
//           >
//             <path
//               stroke="currentColor"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
//             />
//           </svg>
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span> 
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             Only PNG, JPG, GIF, and PDF are allowed
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//           accept=".png, .jpg, .jpeg, .gif, .pdf"
//         />
//       </label>

//       {/* Preview Section */}
//       <div
//         className="flex flex-nowrap mt-4 overflow-x-auto w-full"
//         style={{ cursor: 'grab' }}
//         ref={containerRef}
//         onMouseDown={(e) => handleMouseDown(e, containerRef)}
//       >
//         {fileUrls.length > 0 ? (
//           fileUrls.map(({ fileUrl, fileName, fileType }, index) => (
//             <div key={index} className="relative min-w-[200px] max-w-[300px] h-[200px] mr-2 mb-2 overflow-hidden">
//               {fileType.startsWith('image/') ? (
//                 <div className="relative w-full h-full flex items-center justify-center bg-gray-200">
//                   <img
//                     src={fileUrl}
//                     alt={`preview ${index}`}
//                     className="object-cover w-full h-full cursor-pointer"
//                     onClick={() => handleClick(fileUrl)}
//                   />
//                   <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
//                     {fileName}
//                   </p>
//                 </div>
//               ) : fileType === 'application/pdf' ? (
//                 <div
//                   className="relative w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer overflow-hidden"
//                   onClick={() => handleClick(fileUrl)}
//                 >
//                   <iframe
//                     src={fileUrl}
//                     style={{ width: '100%', height: '100%', border: 'none' }}
//                     title={`PDF preview ${index}`}
//                   />
//                   <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
//                     {fileName}
//                   </p>
//                 </div>
//               ) : (
//                 <div
//                   className="w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer"
//                   onClick={() => handleClick(fileUrl)}
//                 >
//                   <p className="text-xs text-gray-500">{fileName}</p>
//                 </div>
//               )}
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-500">No files selected</p>
//         )}
//       </div>
//     </div>
//   );
// }






























// import React, { useState, useEffect, useRef } from 'react';

// export default function FileUploader() {
//   const [fileUrls, setFileUrls] = useState([]);
//   const urlsRef = useRef([]);

//   // Handle file selection
//   const handleFileChange = (event) => {
//     const selectedFiles = Array.from(event.target.files);
//     const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

//     // Filter out invalid file types
//     const validFiles = selectedFiles.filter(file => validTypes.includes(file.type));

//     // Generate URLs for valid files
//     const newFileUrls = validFiles.map(file => {
//       const url = URL.createObjectURL(file);
//       return { url, name: file.name, type: file.type };
//     });

//     // Update URLs and ref
//     setFileUrls(prevFileUrls => [...prevFileUrls, ...newFileUrls]);
//     urlsRef.current = [...urlsRef.current, ...newFileUrls.map(file => file.url)];
//   };

//   // Cleanup URLs when component unmounts or fileUrls change
//   useEffect(() => {
//     return () => {
//       urlsRef.current.forEach(url => URL.revokeObjectURL(url));
//     };
//   }, []);

//   const handleClick = (url) => {
//     window.open(url, '_blank', 'noopener,noreferrer');
//   };

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <svg
//             className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
//             aria-hidden="true"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 20 16"
//           >
//             <path
//               stroke="currentColor"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
//             />
//           </svg>
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span> or drag and drop
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             Only PNG, JPG, GIF, and PDF are allowed
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//           accept=".png, .jpg, .jpeg, .gif, .pdf"
//         />
//       </label>

//       {/* Preview Section */}
//       <div className="flex flex-wrap mt-4">
//         {fileUrls.length > 0 ? (
//           fileUrls.map(({ url, name, type }, index) => (
//             <div key={index} className="relative flex-1 min-w-[200px] max-w-[300px] h-[200px] mr-2 mb-2 overflow-hidden">
//               {type.startsWith('image/') ? (
//                 <div className="relative w-full h-full flex items-center justify-center bg-gray-200">
//                   <img
//                     src={url}
//                     alt={`preview ${index}`}
//                     className="object-cover w-full h-full cursor-pointer"
//                     onClick={() => handleClick(url)}
//                   />
//                   <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
//                     {name}
//                   </p>
//                 </div>
//               ) : type === 'application/pdf' ? (
//                 <div
//                   className="relative w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer overflow-hidden"
//                   onClick={() => handleClick(url)}
//                 >
//                   <iframe
//                     src={url}
//                     style={{ width: '100%', height: '100%', border: 'none' }}
//                     title={`PDF preview ${index}`}
//                   />
//                   <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
//                     {name}
//                   </p>
//                 </div>
//               ) : (
//                 <div
//                   className="w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer"
//                   onClick={() => handleClick(url)}
//                 >
//                   <p className="text-xs text-gray-500">{name}</p>
//                 </div>
//               )}
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-500">No files selected</p>
//         )}
//       </div>
//     </div>
//   );
// }





















// import React, { useState, useEffect, useRef } from 'react';

// export default function FileUploader() {
//   const [fileUrls, setFileUrls] = useState([]);
//   const urlsRef = useRef([]);

//   // Handle file selection
//   const handleFileChange = (event) => {
//     const selectedFiles = Array.from(event.target.files);
//     const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

//     // Filter out invalid file types
//     const validFiles = selectedFiles.filter(file => validTypes.includes(file.type));

//     // Generate URLs for valid files
//     const newFileUrls = validFiles.map(file => {
//       const url = URL.createObjectURL(file);
//       return { url, name: file.name, type: file.type };
//     });

//     // Update URLs and ref
//     setFileUrls(prevFileUrls => [...prevFileUrls, ...newFileUrls]);
//     urlsRef.current = [...urlsRef.current, ...newFileUrls.map(file => file.url)];
//   };

//   // Cleanup URLs when component unmounts or fileUrls change
//   useEffect(() => {
//     return () => {
//       urlsRef.current.forEach(url => URL.revokeObjectURL(url));
//     };
//   }, []);

//   const handleClick = (url) => {
//     console.log('Opening URL:', url);
//     window.open(url, '_blank', 'noopener,noreferrer');
//   };

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <svg
//             className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
//             aria-hidden="true"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 20 16"
//           >
//             <path
//               stroke="currentColor"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
//             />
//           </svg>
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span> or drag and drop
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             Only PNG, JPG, GIF, and PDF are allowed
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//           accept=".png, .jpg, .jpeg, .gif, .pdf"
//         />
//       </label>

//       {/* Preview Section */}
//       <div className="flex flex-wrap mt-4">
//         {fileUrls.length > 0 ? (
//           fileUrls.map(({ url, name, type }, index) => (
//             // <div key={index} className="flex-1 relative w-full h-full mr-2 mb-2">
//             <div key={index} className="relative flex-1 min-w-[200px] max-w-[300px] h-[200px] mr-2 mb-2 ">  
//             {type.startsWith('image/') ? (
//                 <img
//                   src={url}
//                   alt={`preview ${index}`}
//                 //   object-cover
//                   className="object-contain w-full h-full  cursor-pointer"
//                   onClick={() => handleClick(url)}
//                 />
//               ) : type === 'application/pdf' ? (
//                 <div
//                   className="relative w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer"
//                   onClick={() => handleClick(url)}
//                 >
//                   <iframe
//                     src={url}
//                     style={{ width: '100%', height: '100%', border: 'none' ,overflow: 'hidden'}}
//                     title={`PDF preview ${index}`}
//                   />
//                 </div>
//               ) : (
//                 <div
//                   className="w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer"
//                   onClick={() => handleClick(url)}
//                 >
//                   <p className="text-xs text-gray-500">{name}</p>
//                 </div>
//               )}
//               <p
//                 className="text-xs text-gray-500 cursor-pointer"
//                 onClick={() => handleClick(url)}
//               >
//                 {name}
//               </p>
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-500">No files selected</p>
//         )}
//       </div>
//     </div>
//   );
// }























// import React, { useState, useEffect, useRef } from 'react';

// export default function FileUploader() {
//   const [fileUrls, setFileUrls] = useState([]);
//   const urlsRef = useRef([]);

//   // Handle file selection
//   const handleFileChange = (event) => {
//     const selectedFiles = Array.from(event.target.files);

//     // Generate URLs for new files
//     const newFileUrls = selectedFiles.map(file => {
//       const url = URL.createObjectURL(file);
//       return { url, name: file.name, type: file.type };
//     });

//     // Update URLs and ref
//     setFileUrls(prevFileUrls => [...prevFileUrls, ...newFileUrls]);
//     urlsRef.current = [...urlsRef.current, ...newFileUrls.map(file => file.url)];
//   };

//   // Cleanup URLs when component unmounts or fileUrls change
//   useEffect(() => {
//     return () => {
//       urlsRef.current.forEach(url => URL.revokeObjectURL(url));
//     };
//   }, []);

//   const handleClick = (url) => {
//     console.log('Opening URL:', url);
//     window.open(url, '_blank', 'noopener,noreferrer');
//   };

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <svg
//             className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
//             aria-hidden="true"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 20 16"
//           >
//             <path
//               stroke="currentColor"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
//             />
//           </svg>
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span> or drag and drop
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             SVG, PNG, JPG, GIF, or PDF (MAX. 800x400px)
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//         />
//       </label>

//       {/* Preview Section */}
//       <div className="flex flex-wrap mt-4">
//         {fileUrls.length > 0 ? (
//           fileUrls.map(({ url, name, type }, index) => (
//             <div key={index} className="relative w-24 h-24 mr-2 mb-2">
//               {type.startsWith('image/') ? (
//                 <img
//                   src={url}
//                   alt={`preview ${index}`}
//                   className="w-full h-full object-cover cursor-pointer"
//                   onClick={() => handleClick(url)}
//                 />
//               ) : type === 'application/pdf' ? (
//                 <div
//                   className="relative w-24 h-24 flex items-center justify-center bg-gray-200 cursor-pointer"
//                   onClick={() => handleClick(url)}
//                 >
//                   <iframe
//                     src={url}
//                     style={{ width: '100%', height: '100%', border: 'none' }}
//                     title={`PDF preview ${index}`}
//                   />
//                 </div>
//               ) : (
//                 <div
//                   className="w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer"
//                   onClick={() => handleClick(url)}
//                 >
//                   <p className="text-xs text-gray-500">{name}</p>
//                 </div>
//               )}
//               <p
//                 className="text-xs text-gray-500 cursor-pointer"
//                 onClick={() => handleClick(url)}
//               >
//                 {name}
//               </p>
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-500">No files selected</p>
//         )}
//       </div>
//     </div>
//   );
// }
































// import React, { useState, useEffect, useRef } from 'react';

// export default function FileUploader() {
//   const [fileUrls, setFileUrls] = useState([]);
//   const urlsRef = useRef([]);

//   // Handle file selection
//   const handleFileChange = (event) => {
//     const selectedFiles = Array.from(event.target.files);

//     // Generate URLs for new files
//     const newFileUrls = selectedFiles.map(file => {
//       const url = URL.createObjectURL(file);
//       return { url, name: file.name, type: file.type };
//     });

//     // Update URLs and ref
//     setFileUrls(prevFileUrls => [...prevFileUrls, ...newFileUrls]);
//     urlsRef.current = [...urlsRef.current, ...newFileUrls.map(file => file.url)];
//   };

//   // Cleanup URLs when component unmounts or fileUrls change
//   useEffect(() => {
//     return () => {
//       urlsRef.current.forEach(url => URL.revokeObjectURL(url));
//     };
//   }, []);

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <svg
//             className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
//             aria-hidden="true"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 20 16"
//           >
//             <path
//               stroke="currentColor"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
//             />
//           </svg>
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span> or drag and drop
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             SVG, PNG, JPG, GIF, or PDF (MAX. 800x400px)
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//         />
//       </label>

//       {/* Preview Section */}
//       <div className="flex flex-wrap mt-4">
//         {fileUrls.length > 0 ? (
//           fileUrls.map(({ url, name, type }, index) => (
//             <div key={index} className="relative w-24 h-24 mr-2 mb-2">
//               {type.startsWith('image/') ? (
//                 <>
//                   <img
//                     src={url}
//                     alt={`preview ${index}`}
//                     className="w-full h-full object-cover cursor-pointer"
//                     onClick={() => {
//                       console.log('Opening URL:', url);
//                       window.open(url, '_blank');
//                     }}
//                   />
//                 </>
//               ) : type === 'application/pdf' ? (
//                 <div className="relative w-24 h-24">
//                   <embed
//                     src={url}
//                     type="application/pdf"
//                     className="w-full h-full object-cover cursor-pointer"
//                     onClick={() => {
//                       console.log('Opening URL:', url);
//                       window.open(url, '_blank');
//                     }}
//                   />
//                 </div>
//               ) : (
//                 <div
//                   className="w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer"
//                   onClick={() => {
//                     console.log('Opening URL:', url);
//                     window.open(url, '_blank');
//                   }}
//                 >
//                   <p className="text-xs text-gray-500">{name}</p>
//                 </div>
//               )}
//               <p className="text-xs text-gray-500">{name}</p>
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-500">No files selected</p>
//         )}
//       </div>
//     </div>
//   );
// }


























// import React, { useState, useEffect } from 'react';

// export default function FileUploader() {
//   const [fileUrls, setFileUrls] = useState([]);

//   // Handle file selection
//   const handleFileChange = (event) => {
//     const selectedFiles = Array.from(event.target.files);

//     // Generate URLs for new files
//     const newFileUrls = selectedFiles.map(file => {
//       const url = URL.createObjectURL(file);
//       console.log('Generated URL for file:', url);
//       return { url, name: file.name, type: file.type };
//     });

//     // Append new file URLs to existing ones
//     setFileUrls(prevFileUrls => [...prevFileUrls, ...newFileUrls]);
//     console.log('Selected files:', newFileUrls);
//   };

//   // Cleanup URLs when component unmounts or fileUrls change
//   useEffect(() => {
//     return () => {
//       fileUrls.forEach(({ url }) => URL.revokeObjectURL(url));
//     };
//   }, [fileUrls]);

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <svg
//             className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
//             aria-hidden="true"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 20 16"
//           >
//             <path
//               stroke="currentColor"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
//             />
//           </svg>
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span> or drag and drop
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             SVG, PNG, JPG, GIF, or PDF (MAX. 800x400px)
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//         />
//       </label>

//       {/* Preview Section */}
//       <div className="flex flex-wrap mt-4">
//         {fileUrls.length > 0 ? (
//           fileUrls.map(({ url, name, type }, index) => (
//             <div key={index} className="relative w-24 h-24 mr-2 mb-2">
//               {type.startsWith('image/') ? (
//                 <>
//                   <img
//                     src={url}
//                     alt={`preview ${index}`}
//                     className="w-full h-full object-cover cursor-pointer"
//                     onClick={() => {
//                       console.log('Opening URL:', url);
//                       window.open(url, '_blank');
//                     }}
//                   />
//                 </>
//               ) : type === 'application/pdf' ? (
//                 <div className="relative w-24 h-24">
//                   <embed
//                     src={url}
//                     type="application/pdf"
//                     className="w-full h-full object-cover cursor-pointer"
//                     onClick={() => {
//                       console.log('Opening URL:', url);
//                       window.open(url, '_blank');
//                     }}
//                   />
//                 </div>
//               ) : (
//                 <div
//                   className="w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer"
//                   onClick={() => {
//                     console.log('Opening URL:', url);
//                     window.open(url, '_blank');
//                   }}
//                 >
//                   <p className="text-xs text-gray-500">{name}</p>
//                 </div>
//               )}
//               <p className="text-xs text-gray-500">{name}</p>
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-500">No files selected</p>
//         )}
//       </div>
//     </div>
//   );
// }
























// import React, { useState, useEffect } from 'react';

// export default function FileUploader() {
//   const [fileUrls, setFileUrls] = useState([]);

//   // Handle file selection
//   const handleFileChange = (event) => {
//     const selectedFiles = Array.from(event.target.files);
    

//     // Generate URLs for new files
//     const newFileUrls = selectedFiles.map(file => {
//       const url = URL.createObjectURL(file);
//       console.log('Generated URL for file:', url);
//       return { url, name: file.name };
//     });

//     // Append new file URLs to existing ones
//     setFileUrls(prevFileUrls => [...prevFileUrls, ...newFileUrls]);
//     console.log('Selected files:', fileUrls);  
// };

//   // Cleanup URLs when component unmounts
//   useEffect(() => {
//     return () => {
//       fileUrls.forEach(({ url }) => URL.revokeObjectURL(url));
//     };
//   }, []);

//   return (
//     <div className="flex flex-col items-center justify-center w-full">
//       <label
//         htmlFor="dropzone-file"
//         className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
//       >
//         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//           <svg
//             className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
//             aria-hidden="true"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 20 16"
//           >
//             <path
//               stroke="currentColor"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
//             />
//           </svg>
//           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
//             <span className="font-semibold">Click to upload</span> or drag and drop
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             SVG, PNG, JPG or GIF (MAX. 800x400px)
//           </p>
//         </div>
//         <input
//           id="dropzone-file"
//           type="file"
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//         />
//       </label>

//       {/* Preview Section */}
//       <div className="flex flex-wrap mt-4">
//         {fileUrls.length > 0 ? (
//           fileUrls.map(({ url, name }, index) => (
//             <div key={index} className="relative w-24 h-24 mr-2 mb-2">
//               <img
//                 src={url}
//                 alt={`preview ${index}`}
//                 className="w-full h-full object-cover cursor-pointer"
//                 onClick={() => {
//                   console.log('Opening URL:', url); // Log URL being opened
//                   window.open(url, '_blank');
//                 }}
//               />
//               <p className="text-xs text-gray-500">{name}</p>
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-500">No files selected</p>
//         )}
//       </div>
//     </div>
//   );
// }
