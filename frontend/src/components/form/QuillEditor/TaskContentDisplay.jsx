// src/components/task/TaskContentDisplay.jsx
import React, { useMemo } from "react";
import "quill/dist/quill.snow.css"; // styling for lists, indent, etc.

function decodeMaybe(html) {
  if (typeof html !== "string") return "";
  if (html.includes("&lt;") || html.includes("&gt;") || html.includes("&amp;")) {
    const t = document.createElement("textarea");
    t.innerHTML = html;
    return t.value;
  }
  return html;
}

export default function TaskContentDisplay({ description }) {
  const html = useMemo(() => decodeMaybe(description || ""), [description]);

  // render inside .ql-snow .ql-editor so Quill CSS styles apply
  return (
    <div className="ql-snow">
      <div
        className="ql-editor task-description"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}












// import React from 'react';

// const TaskContentDisplay = ({ description }) => {
//   return (
//     <>
//     <div
//       dangerouslySetInnerHTML={{ __html: description }}
//       className="task-description"
//     />
//     </>
//   );
// };

// export default TaskContentDisplay;
