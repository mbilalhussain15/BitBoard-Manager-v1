import React, { useState, useEffect, useRef } from 'react';

function PDFPreview({ file }) {
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Reset error state when the file changes
    setLoadError(false);
  }, [file]);

  const handleOpenInNewTab = () => {
    window.open(file.fileUrl, '_blank');
  };

  return (
    <div className="w-full h-full">
      {!loadError ? (
        <>
          {/* Clickable overlay to open PDF in new tab */}
          <div
            onClick={handleOpenInNewTab}
            className="absolute inset-8 cursor-pointer"
            style={{ zIndex: 10, backgroundColor: 'transparent' }}
          ></div>

          {/* iFrame for displaying PDF */}
          <iframe
            ref={iframeRef}
            src={file.fileUrl}
            width="100%"
            height= '600px'
            title="PDF Preview"
            allow="fullscreen"
            onError={() => setLoadError(true)}
            // style={{
            //     width: '100%',
            //     height: '100%',
            //     border: 'none',
            //     overflow: 'hidden',
            //     display: 'block',
            //     transform: 'scale(1)',
            //     transformOrigin: 'top left',
            //     // Adjust these values as needed for your layout
            //     maxWidth: '100%',
            //     maxHeight: '100%',
            //   }}
          />
        </>
      ) : (
        <div className="text-red-500">
          Error loading PDF. Please check the file URL or try again later.
        </div>
      )}
    </div>
  );
}

export default PDFPreview;






















// import React, { useState, useEffect } from 'react';

// function PDFPreview({ file }) {
//   const [loadError, setLoadError] = useState(false);

//   useEffect(() => {
//     // Reset error state when the file changes
//     setLoadError(false);
//   }, [file]);

//   const handleIframeError = () => {
//     setLoadError(true);
//   };

//   return (
//     <div className="w-full h-full">
//       {!loadError ? (
//         <iframe
//           src={file.fileUrl}
//           width="100%"
//           height="600px"
//           title="PDF Preview"
//           onError={handleIframeError}
//         />
//       ) : (
//         <div className="text-red-500">
//           Error loading PDF. Please check the file URL or try again later.
//         </div>
//       )}
//     </div>
//   );
// }

// export default PDFPreview;
