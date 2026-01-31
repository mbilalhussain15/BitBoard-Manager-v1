// src/components/form/QuillEditor/QuillEditor.jsx
import React, { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css";
import "./QuillEditor.css";

export default function QuillEditor({ value, onChange }) {
  const rootRef = useRef(null);
  const quillRef = useRef(null);

  const applyValueOnce = (v) => {
    const quill = quillRef.current;
    if (!quill) return;

    // empty -> clear
    if (v == null || v === "") {
      quill.setContents([], "silent");
      return;
    }

    // delta object
    if (typeof v === "object" && Array.isArray(v.ops)) {
      quill.setContents(v, "silent");
      return;
    }

    // delta as JSON string
    if (typeof v === "string" && v.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(v);
        if (parsed && Array.isArray(parsed.ops)) {
          quill.setContents(parsed, "silent");
          return;
        }
      } catch {
        // ignore
      }
    }

    // HTML string
    try {
      const delta = quill.clipboard.convert(String(v));
      quill.setContents(delta, "silent");

      // fallback: if still empty, force raw HTML
      const el = rootRef.current?.querySelector(".ql-editor");
      const empty =
        el &&
        (el.innerHTML === "" ||
          el.innerHTML === "<p><br></p>" ||
          el.textContent?.trim() === "");
      if (empty && el) el.innerHTML = String(v);
    } catch {
      quill.setContents([], "silent");
    }
  };

  // init once and prefill once
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { default: Quill } = await import("quill");
      if (!mounted || !rootRef.current) return;

      quillRef.current = new Quill(rootRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
            ["clean"],
          ],
        },
      });

      // prefill only ONCE on mount
      applyValueOnce(value);

      // emit HTML on user edits
      quillRef.current.on("text-change", () => {
        const html = rootRef.current?.querySelector(".ql-editor")?.innerHTML ?? "";
        onChange?.(html);
      });
    })();

    return () => {
      mounted = false;
      quillRef.current = null;
    };
  }, []); // no [value] effect at all

  return (
    <div className="quill-wrapper">
      <div ref={rootRef} />
    </div>
  );
}

























// // src/components/form/QuillEditor/QuillEditor.jsx
// import React, { useEffect, useRef } from "react";
// import "quill/dist/quill.snow.css";
// import './QuillEditor.css';


// export default function QuillEditor({ value, onChange }) {
//   const rootRef = useRef(null);
//   const quillRef = useRef(null);
//   const readyRef = useRef(false);

//   const applyValue = (v) => {
//     const quill = quillRef.current;
//     if (!quill) return;

//     // 1) null or empty => clear
//     if (v == null || v === "") {
//       quill.setContents([], "silent");
//       return;
//     }

//     // 2) if already a Delta object
//     if (typeof v === "object" && Array.isArray(v.ops)) {
//       quill.setContents(v, "silent");
//       return;
//     }

//     // 3) if JSON string representing Delta
//     if (typeof v === "string" && v.trim().startsWith("{")) {
//       try {
//         const parsed = JSON.parse(v);
//         if (parsed && Array.isArray(parsed.ops)) {
//           quill.setContents(parsed, "silent");
//           return;
//         }
//       } catch {
//         // fall through
//       }
//     }

//     // 4) treat as HTML
//     try {
//       const html = String(v);
//       // First try Quill's converter
//       const delta = quill.clipboard.convert(html);
//       quill.setContents(delta, "silent");

//       // If after conversion editor still looks empty, force set raw HTML
//       const editorEl = rootRef.current?.querySelector(".ql-editor");
//       const looksEmpty =
//         editorEl &&
//         (editorEl.innerHTML === "" ||
//           editorEl.innerHTML === "<p><br></p>" ||
//           editorEl.textContent?.trim() === "");

//       if (looksEmpty && editorEl) {
//         editorEl.innerHTML = html;
//       }
//     } catch {
//       // absolute fallback: just clear rather than crash
//       quill.setContents([], "silent");
//     }
//   };

//   // Init once
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       const { default: Quill } = await import("quill");
//       if (!mounted || !rootRef.current) return;

//       quillRef.current = new Quill(rootRef.current, {
//         theme: "snow",
//         modules: {
//           toolbar: [
//             ["bold", "italic", "underline", "strike"],
//             [{ list: "ordered" }, { list: "bullet" }],
//             ["link"],
//             ["clean"],
//           ],
//         },
//       });

//       readyRef.current = true;

//       // Always apply initial value even if empty
//       applyValue(value);

//       // Emit HTML on changes
//       quillRef.current.on("text-change", () => {
//         const html = rootRef.current?.querySelector(".ql-editor")?.innerHTML ?? "";
//         onChange?.(html);
//       });
//     })();

//     return () => {
//       mounted = false;
//       readyRef.current = false;
//       quillRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Keep external value in sync every time it changes
//   useEffect(() => {
//     const id = setTimeout(() => {
//       applyValue(value);
//     }, readyRef.current ? 0 : 100);
//     return () => clearTimeout(id);
//   }, [value]);

//   // return <div ref={rootRef} />;
//     return (
//       //  <div ref={rootRef} className="p-1 ql-container"/>
//       <div className="quill-wrapper p- .ql-container">
//       <div ref={rootRef} />
//     </div>
//     );
// }
























// // QuillEditor.jsx — React 19-safe wrapper around Quill v2 (no react-quill)
// import React, { useEffect, useRef } from "react";
// import "quill/dist/quill.snow.css";     // Quill's theme CSS
// import "./QuillEditor.css";             // your custom styling (toolbar, colors, etc.)


// export default function QuillEditor({ value, onChange }) {
//   const rootRef = useRef(null);  // <div> that will host Quill
//   const quillRef = useRef(null); // Quill instance

//   // Init once
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       const { default: Quill } = await import("quill"); // v2
//       if (!mounted || !rootRef.current) return;

//       // Create editor
//       quillRef.current = new Quill(rootRef.current, {
//         theme: "snow",
//         modules: {
//           toolbar: [
//             ["bold", "italic", "underline", "strike"],
//             [{ list: "ordered" }, { list: "bullet" }],
//             ["link"],
//             ["clean"],
//           ],
//         },
//       });

//       // Set initial HTML (if any)
//       if (value) {
//         const delta = quillRef.current.clipboard.convert(value);
//         quillRef.current.setContents(delta, "silent");
//       }

//       // Propagate changes up as HTML
//       quillRef.current.on("text-change", () => {
//         const html = rootRef.current
//           ?.querySelector(".ql-editor")
//           ?.innerHTML ?? "";
//         onChange?.(html);
//       });
//     })();

//     return () => {
//       mounted = false;
//       // Quill v2 has no special destroy; removing listeners & letting GC clean up
//       quillRef.current = null;
//     };
//   }, []); // init once

//   // Keep external `value` in sync (controlled usage)
//   useEffect(() => {
//     if (!quillRef.current) return;
//     const editorEl = rootRef.current?.querySelector(".ql-editor");
//     if (!editorEl) return;

//     const current = editorEl.innerHTML;
//     if (value != null && value !== current) {
//       const delta = quillRef.current.clipboard.convert(value);
//       quillRef.current.setContents(delta, "silent");
//     }
//   }, [value]);

//   return (
//     <div className="p-1 ql-container">
//       {/* Quill injects toolbar+editor inside this container */}
//       <div ref={rootRef} />
//     </div>
//   );
// }


















// import React, { useState, useEffect } from 'react';
// import './QuillEditor.css';

// const QuillEditor = ({ value, onChange }) => {
//   const [ReactQuill, setReactQuill] = useState(null);

//   useEffect(() => {
//     // dynamically import react-quill only on client side
//     import('react-quill').then((mod) => {
//       setReactQuill(() => mod.default);
//       // Also import CSS dynamically if you want
//       import('react-quill/dist/quill.snow.css');
//     });
//   }, []);

//   const handleChange = (content, delta, source, editor) => {
//     onChange(content);
//   };

//   if (!ReactQuill) {
//     return <div>Loading editor...</div>;
//   }

//   return (
//     <div className="p-1">
//       <ReactQuill
//         value={value}
//         onChange={handleChange}
//         theme="snow"
//         modules={{
//           // toolbar: [
//           //   [{ header: '1' }, { header: '2' }, { font: [] }],
//           //   [{ size: [] }],
//           //   ['bold', 'italic', 'underline', 'strike', 'blockquote'],
//           //   [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
//           //   ['link', 'image', 'video'],
//           //   ['clean'],
//           // ],
//           toolbar: [['bold', 'italic', 'underline', 'strike']],
//         }}
//         className="ql-container"
//       />
//     </div>
//   );
// };

// export default QuillEditor;
