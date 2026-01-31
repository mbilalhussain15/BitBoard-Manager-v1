import React, { useEffect, useRef } from 'react';
import { AiOutlineDelete } from 'react-icons/ai';
import PDFPreview from '../PDFPreview';

const TaskDetailFilePreview = ({ previewFiles }) => {
  const scrollContainerRef = useRef(null);

  const renderFilePreview = (file) => {
    switch (file.fileType) {
      case 'application/pdf':
        return (
          <div style={{ width: '100%', height: '100%' }} className='w-full h-full'>
            <PDFPreview file={file} />
          </div>
        );
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
      case 'image/gif':
        return <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-fill" />;
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
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

  // Drag-to-scroll functionality
  useEffect(() => {
    const container = scrollContainerRef.current;
    let isDown = false;
    let startX;
    let scrollLeft;

    const mouseDownHandler = (e) => {
      isDown = true;
      container.classList.add('active');
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };

    const mouseLeaveHandler = () => {
      isDown = false;
      container.classList.remove('active');
    };

    const mouseUpHandler = () => {
      isDown = false;
      container.classList.remove('active');
    };

    const mouseMoveHandler = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2; // Scroll-fast
      container.scrollLeft = scrollLeft - walk;
    };

    container.addEventListener('mousedown', mouseDownHandler);
    container.addEventListener('mouseleave', mouseLeaveHandler);
    container.addEventListener('mouseup', mouseUpHandler);
    container.addEventListener('mousemove', mouseMoveHandler);

    return () => {
      container.removeEventListener('mousedown', mouseDownHandler);
      container.removeEventListener('mouseleave', mouseLeaveHandler);
      container.removeEventListener('mouseup', mouseUpHandler);
      container.removeEventListener('mousemove', mouseMoveHandler);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Preview Section */}
      <div
        ref={scrollContainerRef}
        className="flex flex-nowrap mt-4 overflow-x-auto w-full cursor-grab"
        style={{ cursor: 'grab' }}
      >
        {previewFiles.length > 0 && (
          <div className="flex space-x-4">
            {previewFiles.map((file, index) => (
              <div
                key={index}
                className="relative w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
                style={{ cursor: 'pointer' }}
                onClick={() => window.open(file.fileUrl, '_blank')} // Open file in new tab
              >
                {renderFilePreview(file)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailFilePreview;
