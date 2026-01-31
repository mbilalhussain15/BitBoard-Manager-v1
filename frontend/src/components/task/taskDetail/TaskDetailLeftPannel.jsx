import React, { useEffect, useState } from 'react'
import { UseGetTaskById } from '../../../hooks/useTaskService';
import { useParams } from 'react-router-dom';
import TaskContentDisplay from '../../form/QuillEditor/TaskContentDisplay';
import { useGetTaskFiles } from '../../../hooks/useTaskFileService';
import TaskDetailFilePreview from './TaskDetailFilePreview';
import Comments from '../../comments/Comments';



function TaskDetailLeftPannel(
    { workspaceId, projectId, boardId, taskId, taskData, currentBoard, isTaskLoading}
) {

    const [fileUrls, setFileUrls] = useState([]);

useEffect(() => {
    if (taskData?.attachments && Array.isArray(taskData.attachments)) {
      const existing = taskData.attachments.map(a => ({
        fileUrl: a.fileUrl,
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
        uploadedBy: a.uploadedBy,
        uploadedAt: a.uploadedAt,
      }));
      setFileUrls(existing);
    } else {
      setFileUrls([]);
    }
  }, [taskData]);

  return (
    <div className='min-h-0 h-full '>
      {isTaskLoading ? (
        <p>Loading task...</p>
      ) : (
       <div className="h-full overflow-auto pr-2 sm:pr-3 custom-scroll ">
          <h1 className="text-2xl sm:text-2xl font-bold text-black dark:text-white mb-4">
              {   taskData?.taskName || "Task Title"}
            </h1>
            <div
              className="text-gray-900 dark:text-white mb-6 overflow-auto max-h-80 min-h-30 border-2 border-gray-200 dark:border-gray-700 rounded-md">
              {/* // dangerouslySetInnerHTML={{ __html: taskData?.taskDescription }} */}
              <TaskContentDisplay description={taskData?.taskDescription || ""} />
            </div>
            
            <div>
              <h3 className="text-base font-medium mb-2">Attachments</h3>
              {fileUrls.length > 0 ? (
                <TaskDetailFilePreview previewFiles={fileUrls} />
              ) : (
                <p className="text-gray-500 text-sm">No attachments found.</p>
              )}
          </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Welcome back, Task Detail!
            </p>

            <div className="pt-2">
            <Comments taskId={taskId} currentBoard={currentBoard}/>
          </div>
          </div>
      )}
    </div>
  )
}

export default TaskDetailLeftPannel
