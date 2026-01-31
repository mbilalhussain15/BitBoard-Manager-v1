// src/components/task/tabs/CreateTaskAIPlanner.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Paperclip,
  Mic,
  Send,
  Plus,
  Sparkles,
  Loader2,
  Copy,
} from "lucide-react";
import { UseBulkGenerateTasks } from "../../../hooks/useAiPlannerService";
import { toast } from "sonner";

function AutoTextarea({
  value,
  onChange,
  onEnter,
  inputRef,
  maxPx = 220,
  onResize,
}) {
  const internalRef = useRef(null);
  const localRef = inputRef ?? internalRef;
  const rafId = useRef(null);
  const wasAtEndRef = useRef(true);

  const measure = useCallback(
    (el) => {
      if (!el) return;
      el.style.height = "0px";
      const next = Math.min(el.scrollHeight, maxPx);
      el.style.height = next + "px";
      el.style.overflowY = el.scrollHeight > maxPx ? "auto" : "hidden";
      onResize?.(next);

      if (wasAtEndRef.current) {
        const pos = el.value.length;
        el.selectionStart = pos;
        el.selectionEnd = pos;
        el.scrollTop = el.scrollHeight;
      }
    },
    [maxPx, onResize]
  );

  useEffect(() => {
    const el = localRef.current;
    measure(el);
    if (el && document.activeElement === el && wasAtEndRef.current) {
      const pos = el.value.length;
      el.selectionStart = pos;
      el.selectionEnd = pos;
      el.scrollTop = el.scrollHeight;
    }
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [value, measure, localRef]);

  useEffect(() => {
    localRef.current?.focus({ preventScroll: true });
  }, [localRef]);

  return (
    <textarea
      ref={localRef}
      value={value}
      onChange={(e) => {
        const el = e.target;

        wasAtEndRef.current =
          el.selectionStart === el.value.length &&
          el.selectionEnd === el.value.length;

        onChange(el.value);

        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => measure(el));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onEnter?.();
        }
      }}
      rows={1}
      placeholder="Describe the work and I will create tasks for this board"
      className="w-full bg-transparent outline-none text-base placeholder:text-white/50 resize-none leading-6 max-h-[220px] overflow-y-auto p-2"
    />
  );
}

function Bubble({ m }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl border p-3 text-sm leading-relaxed ${
          isUser
            ? "bg-white/10 border-white/20"
            : "bg-white/[0.06] border-white/15"
        }`}
      >
        <div className="flex items-start gap-2">
          <p className="whitespace-pre-wrap">{m.content}</p>
          {!isUser && (
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(m.content)}
              className="opacity-60 hover:opacity-100"
              title="Copy"
            >
              <Copy size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateTaskAIPlanner({
  setFooter,
  workspaceId,
  projectId,
  boardId,
  user,
  refetch,
  onClose,
}) {
  const [value, setValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [introMode, setIntroMode] = useState(true);

  const feedRef = useRef(null);
  const composerRef = useRef(null);

  const { mutateAsync: bulkGenerate } = UseBulkGenerateTasks();

  const ENTER_TALL = 80;
  const EXIT_TALL = 52;
  const [tHeight, setTHeight] = useState(0);
  const [isTall, setIsTall] = useState(false);

  useEffect(() => {
    if (!isTall && tHeight >= ENTER_TALL) setIsTall(true);
    else if (isTall && tHeight <= EXIT_TALL) setIsTall(false);
  }, [tHeight, isTall]);

  useEffect(() => {
    setFooter?.(null);
    return () => setFooter?.(null);
  }, [setFooter]);

  useEffect(() => {
    feedRef.current?.scrollTo({
      top: feedRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  useEffect(() => {
    composerRef.current?.focus({ preventScroll: true });
  }, []);

  const suggestions = useMemo(
    () => [
      "Generate tasks for implementing authentication on this board",
      "Generate tasks for a two week sprint to stabilize production",
      "Generate tasks for refactoring UI components to the new design",
      "Generate tasks for improving performance and caching",
    ],
    []
  );

  // CHANGE: local evaluateTaskIntent removed.
  // All intent and clarification now driven by backend (analyzeTaskPrompt).

  const send = useCallback(async () => {
    const prompt = value.trim();
    if (!prompt || isThinking) return;

    if (!workspaceId || !projectId || !boardId || !user?._id) {
      toast.error(
        "Workspace, project, board, and user are required for AI task generation"
      );
      return;
    }

    if (introMode) setIntroMode(false);

    setValue("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: prompt },
    ]);
    setIsThinking(true);

    try {
      const res = await bulkGenerate({
        prompt,
        projectId,
        boardId,
        createdBy: user._id,
        countHint: 40,
        workspaceId,
      });

      if (res?.requiresClarification) {
        const parts = [];
        if (res.message) parts.push(res.message);

        if (res.questions?.length) {
          parts.push(
            "",
            "To help me generate the right tasks, you can answer:",
            ...res.questions.map((q) => `• ${q}`)
          );
        } else if (res.suggestions?.length) {
          parts.push(
            "",
            "You can try:",
            ...res.suggestions.map((s) => `• ${s}`)
          );
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: parts.join("\n"),
          },
        ]);
        setIsThinking(false);
        composerRef.current?.focus({ preventScroll: true });
        return;
      }

      const msg =
        res?.message ||
        "I have started generating tasks for this board based on your description.";

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: msg },
      ]);

      toast.success("AI task generation started");
      setTimeout(() => {
        onClose?.();
        refetch?.();
      }, 500);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate tasks";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${msg}`,
        },
      ]);
      toast.error(msg);
    } finally {
      setIsThinking(false);
      composerRef.current?.focus({ preventScroll: true });
    }
  }, [
    value,
    isThinking,
    introMode,
    workspaceId,
    projectId,
    boardId,
    user,
    bulkGenerate,
    onClose,
    refetch,
  ]);

  return (
    <div className="flex h-[600px] max-h-[85vh] flex-col">
      {introMode && (
        <div className="text-center py-10">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            What should we create tasks for?
          </h2>
        </div>
      )}

      <div
        ref={feedRef}
        className={`flex-1 overflow-y-auto px-4 ${
          introMode ? "hidden" : ""
        }`}
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-3 pb-44">
          {messages.map((m) => (
            <Bubble key={m.id} m={m} />
          ))}
          {isThinking && (
            <div className="mt-1 flex items-center gap-2 text-sm opacity-80">
              <Loader2 className="animate-spin" size={16} />
              thinking
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 w-full bg-gradient-to-t to-transparent pt-2">
        <div className="mx-auto w-full max-w-3xl px-3 pb-3">
          {!isTall ? (
            <div className="flex items-end gap-2 rounded-2xl bg-white/[0.06] p-2 pl-3 border border-white/10 shadow-lg min-h-[44px]">
              <button
                type="button"
                className="rounded-full p-2 hover:bg-white/10 flex-shrink-0 h-11 w-11 flex items-center justify-center"
                title="Add context"
                onClick={() =>
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content:
                        "Describe the feature, module, or sprint goal and I will help break it into tasks.",
                    },
                  ])
                }
              >
                <Plus size={18} />
              </button>

              <AutoTextarea
                value={value}
                onChange={setValue}
                onEnter={send}
                inputRef={composerRef}
                onResize={setTHeight}
                maxPx={220}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full p-2 hover:bg-white/10 flex-shrink-0 h-11 w-11 flex items-center justify-center"
                  title="Voice"
                >
                  <Mic size={18} />
                </button>
                <button
                  type="button"
                  className="rounded-full p-2 hover:bg-white/10 flex-shrink-0 h-11 w-11 flex items-center justify-center"
                  title="Attach"
                >
                  <Paperclip size={18} />
                </button>
                <button
                  type="button"
                  onClick={send}
                  disabled={isThinking}
                  className="rounded-full p-2 hover:bg-white/10 flex-shrink-0 h-11 w-11 flex items-center justify-center"
                  title="Send"
                >
                  {isThinking ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] shadow-lg overflow-hidden">
              <div className="border-b border-white/10">
                <AutoTextarea
                  value={value}
                  onChange={setValue}
                  onEnter={send}
                  inputRef={composerRef}
                  onResize={setTHeight}
                  maxPx={220}
                />
              </div>

              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full p-2 hover:bg-white/10 h-11 w-11 flex items-center justify-center"
                    title="Add context"
                    onClick={() =>
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          role: "assistant",
                          content:
                            "Mention priorities, owners, or deadlines if you want more specific tasks.",
                        },
                      ])
                    }
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full p-2 hover:bg-white/10 h-11 w-11 flex items-center justify-center"
                    title="Voice"
                  >
                    <Mic size={18} />
                  </button>
                  <button
                    type="button"
                    className="rounded-full p-2 hover:bg-white/10 h-11 w-11 flex items-center justify-center"
                    title="Attach"
                  >
                    <Paperclip size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={send}
                    disabled={isThinking}
                    className="rounded-full p-2 hover:bg-white/10 flex-shrink-0 h-11 w-11 flex items-center justify-center"
                    title="Send"
                  >
                    {isThinking ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {introMode && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {suggestions.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => setValue(text)}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                  <span className="inline-flex items-center gap-1">
                    <Sparkles size={14} />
                    {text}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
































// // src/components/task/tabs/CreateTaskAIPlanner.jsx

// import React, {
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
//   useCallback,
// } from "react";
// import { Paperclip, Mic, Send, Plus, Sparkles, Loader2, Copy } from "lucide-react";
// import { UseBulkGenerateTasks } from "../../../hooks/useAiPlannerService";
// import { toast } from "sonner";

// function AutoTextarea({ value, onChange, onEnter, inputRef, maxPx = 220, onResize }) {
//   const internalRef = useRef(null);
//   const localRef = inputRef ?? internalRef;
//   const rafId = useRef(null);
//   const wasAtEndRef = useRef(true);

//   const measure = useCallback(
//     el => {
//       if (!el) return;
//       el.style.height = "0px";
//       const next = Math.min(el.scrollHeight, maxPx);
//       el.style.height = next + "px";
//       el.style.overflowY = el.scrollHeight > maxPx ? "auto" : "hidden";
//       onResize?.(next);

//       if (wasAtEndRef.current) {
//         const pos = el.value.length;
//         el.selectionStart = pos;
//         el.selectionEnd = pos;
//         el.scrollTop = el.scrollHeight;
//       }
//     },
//     [maxPx, onResize]
//   );

//   useEffect(() => {
//     const el = localRef.current;
//     measure(el);
//     if (el && document.activeElement === el && wasAtEndRef.current) {
//       const pos = el.value.length;
//       el.selectionStart = pos;
//       el.selectionEnd = pos;
//       el.scrollTop = el.scrollHeight;
//     }
//     return () => {
//       if (rafId.current) cancelAnimationFrame(rafId.current);
//     };
//   }, [value, measure, localRef]);

//   useEffect(() => {
//     localRef.current?.focus({ preventScroll: true });
//   }, [localRef]);

//   return (
//     <textarea
//       ref={localRef}
//       value={value}
//       onChange={e => {
//         const el = e.target;

//         wasAtEndRef.current =
//           el.selectionStart === el.value.length &&
//           el.selectionEnd === el.value.length;

//         onChange(el.value);

//         if (rafId.current) cancelAnimationFrame(rafId.current);
//         rafId.current = requestAnimationFrame(() => measure(el));
//       }}
//       onKeyDown={e => {
//         if (e.key === "Enter" && !e.shiftKey) {
//           e.preventDefault();
//           onEnter?.();
//         }
//       }}
//       rows={1}
//       placeholder="Describe the work and let AI create tasks"
//       className="w-full bg-transparent outline-none text-base placeholder:text-white/50 resize-none leading-6 max-h-[220px] overflow-y-auto p-2"
//     />
//   );
// }

// function Bubble({ m }) {
//   const isUser = m.role === "user";
//   return (
//     <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
//       <div
//         className={`max-w-[80%] rounded-2xl border p-3 text-sm leading-relaxed ${
//           isUser
//             ? "bg-white/10 border-white/20"
//             : "bg-white/[0.06] border-white/15"
//         }`}
//       >
//         <div className="flex items-start gap-2">
//           <p className="whitespace-pre-wrap">{m.content}</p>
//           {!isUser && (
//             <button
//               type="button"
//               onClick={() => navigator.clipboard.writeText(m.content)}
//               className="opacity-60 hover:opacity-100"
//               title="Copy"
//             >
//               <Copy size={16} />
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // props: wired from AddNewTaskModal
// // requires: workspaceId, projectId, boardId, user, refetch, onClose
// export default function CreateTaskAIPlanner({
//   setFooter,
//   workspaceId,
//   projectId,
//   boardId,
//   user,
//   refetch,
//   onClose,
// }) {
//   const [value, setValue] = useState("");
//   const [isThinking, setIsThinking] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [introMode, setIntroMode] = useState(true);

//   const feedRef = useRef(null);
//   const composerRef = useRef(null);

//   const { mutateAsync: bulkGenerate } = UseBulkGenerateTasks();

//   const ENTER_TALL = 80;
//   const EXIT_TALL = 52;
//   const [tHeight, setTHeight] = useState(0);
//   const [isTall, setIsTall] = useState(false);

//   useEffect(() => {
//     if (!isTall && tHeight >= ENTER_TALL) setIsTall(true);
//     else if (isTall && tHeight <= EXIT_TALL) setIsTall(false);
//   }, [tHeight, isTall]);

//   useEffect(() => {
//     setFooter?.(null);
//     return () => setFooter?.(null);
//   }, [setFooter]);

//   useEffect(() => {
//     feedRef.current?.scrollTo({
//       top: feedRef.current.scrollHeight,
//       behavior: "smooth",
//     });
//   }, [messages, isThinking]);

//   useEffect(() => {
//     composerRef.current?.focus({ preventScroll: true });
//   }, []);

//   const suggestions = useMemo(
//     () => [
//       "Break down this feature into tasks",
//       "Generate tasks for a two week sprint",
//       "Create tasks for a bug bash",
//       "Create tasks for onboarding flow",
//     ],
//     []
//   );

//   const send = useCallback(async () => {
//     const prompt = value.trim();
//     if (!prompt || isThinking) return;

//     if (!projectId || !boardId || !user?._id) {
//       toast.error("Project, board and user are required for AI task generation");
//       return;
//     }

//     if (introMode) setIntroMode(false);

//     setValue("");
//     setMessages(prev => [
//       ...prev,
//       { id: crypto.randomUUID(), role: "user", content: prompt },
//     ]);
//     setIsThinking(true);

//     try {
//       const payload = {
//         prompt,
//         projectId,
//         boardId,
//         createdBy: user._id,
//         countHint: 40,
//         workspaceId,
//       };

//       const res = await bulkGenerate(payload);

//       const summary =
//         res?.message || "Bulk task generation queued successfully";

//       const details =
//         res?.tasks ||
//         res?.data?.tasks ||
//         res?.result ||
//         res?.data ||
//         null;

//       setMessages(prev => [
//         ...prev,
//         {
//           id: crypto.randomUUID(),
//           role: "assistant",
//           content: details
//             ? `${summary}\n\n${JSON.stringify(details, null, 2)}`
//             : summary,
//         },
//       ]);

//       toast.success("AI task generation started");

//       // close modal and refresh board/tasks so new tasks appear
//       setTimeout(() => {
//         onClose?.();
//         refetch?.();
//       }, 500);
//     } catch (err) {
//       const msg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Failed to generate tasks";
//       setMessages(prev => [
//         ...prev,
//         {
//           id: crypto.randomUUID(),
//           role: "assistant",
//           content: `Error: ${msg}`,
//         },
//       ]);
//       toast.error(msg);
//     } finally {
//       setIsThinking(false);
//       composerRef.current?.focus({ preventScroll: true });
//     }
//   }, [
//     value,
//     isThinking,
//     introMode,
//     bulkGenerate,
//     projectId,
//     boardId,
//     user,
//     workspaceId,
//     onClose,
//     refetch,
//   ]);

//   return (
//     <div className="flex h-[600px] max-h-[85vh] flex-col">
//       {introMode && (
//         <div className="text-center py-10">
//           <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
//             What should we create tasks for?
//           </h2>
//         </div>
//       )}

//       <div
//         ref={feedRef}
//         className={`flex-1 overflow-y-auto px-4 ${
//           introMode ? "hidden" : ""
//         }`}
//       >
//         <div className="max-w-3xl mx-auto flex flex-col gap-3 pb-44">
//           {messages.map(m => (
//             <Bubble key={m.id} m={m} />
//           ))}
//           {isThinking && (
//             <div className="mt-1 flex items-center gap-2 text-sm opacity-80">
//               <Loader2 className="animate-spin" size={16} />
//               thinking
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="sticky bottom-0 w-full bg-gradient-to-t to-transparent pt-2">
//         <div className="mx-auto w-full max-w-3xl px-3 pb-3">
//           {!isTall ? (
//             <div className="flex items-end gap-2 rounded-2xl bg-white/[0.06] p-2 pl-3 border border-white/10 shadow-lg min-h-[44px]">
//               <button
//                 type="button"
//                 className="rounded-full p-2 hover:bg-white/10 flex-shrink-0 h-11 w-11 flex items-center justify-center"
//                 title="Add context"
//                 onClick={() =>
//                   setMessages(prev => [
//                     ...prev,
//                     {
//                       id: crypto.randomUUID(),
//                       role: "assistant",
//                       content:
//                         "You can paste requirements, user stories or feature list here.",
//                     },
//                   ])
//                 }
//               >
//                 <Plus size={18} />
//               </button>

//               <AutoTextarea
//                 value={value}
//                 onChange={setValue}
//                 onEnter={send}
//                 inputRef={composerRef}
//                 onResize={setTHeight}
//                 maxPx={220}
//               />

//               <div className="flex items-center gap-2">
//                 <button
//                   type="button"
//                   className="rounded-full p-2 hover:bg-white/10 flex-shrink-0 h-11 w-11 flex items-center justify-center"
//                   title="Voice"
//                 >
//                   <Mic size={18} />
//                 </button>
//                 <button
//                   type="button"
//                   className="rounded-full p-2 hover:bg-white/10 flex-shrink-0 h-11 w-11 flex items-center justify-center"
//                   title="Attach"
//                 >
//                   <Paperclip size={18} />
//                 </button>
//                 <button
//                   type="button"
//                   onClick={send}
//                   disabled={isThinking}
//                   className="rounded-full p-2 hover:bg-white/10 flex-shrink-0 h-11 w-11 flex items-center justify-center"
//                   title="Send"
//                 >
//                   {isThinking ? (
//                     <Loader2 className="animate-spin" size={18} />
//                   ) : (
//                     <Send size={18} />
//                   )}
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <div className="rounded-2xl border border-white/10 bg-white/[0.06] shadow-lg overflow-hidden">
//               <div className="border-b border-white/10">
//                 <AutoTextarea
//                   value={value}
//                   onChange={setValue}
//                   onEnter={send}
//                   inputRef={composerRef}
//                   onResize={setTHeight}
//                   maxPx={220}
//                 />
//               </div>

//               <div className="flex items-center justify-between p-2">
//                 <div className="flex items-center gap-2">
//                   <button
//                     type="button"
//                     className="rounded-full p-2 hover:bg-white/10 h-11 w-11 flex items-center justify-center"
//                     title="Add context"
//                     onClick={() =>
//                       setMessages(prev => [
//                         ...prev,
//                         {
//                           id: crypto.randomUUID(),
//                           role: "assistant",
//                           content:
//                             "Mention priorities, owners or deadlines to get more precise tasks.",
//                         },
//                       ])
//                     }
//                   >
//                     <Plus size={18} />
//                   </button>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <button
//                     type="button"
//                     className="rounded-full p-2 hover:bg-white/10 h-11 w-11 flex items-center justify-center"
//                     title="Voice"
//                   >
//                     <Mic size={18} />
//                   </button>
//                   <button
//                     type="button"
//                     className="rounded-full p-2 hover:bg-white/10 h-11 w-11 flex items-center justify-center"
//                     title="Attach"
//                   >
//                     <Paperclip size={18} />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={send}
//                     disabled={isThinking}
//                     className="rounded-full p-2 hover:bg-white/10 h-11 w-11 flex items-center justify-center"
//                     title="Send"
//                   >
//                     {isThinking ? (
//                       <Loader2 className="animate-spin" size={18} />
//                     ) : (
//                       <Send size={18} />
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {introMode && (
//             <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
//               {suggestions.map(text => (
//                 <button
//                   key={text}
//                   type="button"
//                   onClick={() => setValue(text)}
//                   className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
//                 >
//                   <span className="inline-flex items-center gap-1">
//                     <Sparkles size={14} />
//                     {text}
//                   </span>
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


















// // import React from 'react'

// // function CreateTaskAIPlanner() {
// //   return (
// //     <div>
// //       Generate Task
// //     </div>
// //   )
// // }

// // export default CreateTaskAIPlanner
