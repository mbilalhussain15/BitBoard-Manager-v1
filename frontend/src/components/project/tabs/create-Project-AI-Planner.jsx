// src/components/project/tabs/create-Project-AI-Planner.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useContext,
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
import { usePlanGenerate } from "../../../hooks/useAiPlannerService";
import { toast } from "sonner";
import { ProjectContext } from "../../../context/ProjectContext";

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
      placeholder="Describe what you want to build and I will design your projects, boards, and tasks"
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

export default function CreateProjectAIPlanner({
  setFooter,
  workspaceId,
  user,
  onOpenChange,
}) {
  const [value, setValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [introMode, setIntroMode] = useState(true);

  const feedRef = useRef(null);
  const composerRef = useRef(null);

  const { mutateAsync: generatePlan } = usePlanGenerate();

  const projectCtx = useContext(ProjectContext) ?? {};
  const {
    refetchProjects = () => {},
    setCurrentProject = () => {},
    setProjects = () => {},
  } = projectCtx;

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
      "Plan a SaaS project management tool for startups",
      "Design a roadmap for an e-commerce platform with cart, checkout, and analytics",
      "Create a plan for a microservices based backend with CI/CD",
      "Plan an internal DevOps platform with approvals and monitoring",
    ],
    []
  );

  // CHANGE: local evaluatePlanIntent removed.
  // All intent and clarification now comes from backend (analyzePlanPrompt).

  const send = useCallback(async () => {
    const content = value.trim();
    if (!content || isThinking) return;

    if (!workspaceId || !user?._id) {
      toast.error("Workspace and user are required for AI planner");
      return;
    }

    if (introMode) setIntroMode(false);

    setValue("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content },
    ]);
    setIsThinking(true);

    try {
      const res = await generatePlan({
        prompt: content,
        workspaceId,
        createdBy: user._id,
        countHint: 60,
      });

      if (res?.requiresClarification) {
        const parts = [];
        if (res.message) parts.push(res.message);
        if (res.questions?.length) {
          parts.push(
            "",
            "To help me plan correctly, you can answer:",
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

      // success path
      const summary =
        res?.message ||
        "I have created a structured project plan based on your description.";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: summary,
        },
      ]);

      toast.success("Project plan created successfully");

      setTimeout(() => {
        Promise.resolve(refetchProjects());
        onOpenChange?.(false);
      }, 600);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate project plan";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Error: " + msg,
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
    user,
    generatePlan,
    refetchProjects,
    onOpenChange,
  ]);

  return (
    <div className="flex h-[600px] max-h-[85vh] flex-col">
      {introMode && (
        <div className="text-center py-10">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Where should we begin?
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

      {/* sticky composer */}
      <div className="sticky bottom-0 w-full bg-gradient-to-t to-transparent pt-2">
        <div className="mx-auto w-full max-w-3xl px-3 pb-3 ">
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
                        "You can paste requirements, specs, or user stories here for a sharper plan.",
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
                            "Mention modules, milestones, and constraints for a better plan.",
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
              {suggestions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue(t)}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                  <span className="inline-flex items-center gap-1">
                    <Sparkles size={14} />
                    {t}
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


























// import React, { useEffect, useMemo, useRef, useState, useCallback, useContext } from "react";
// import { Paperclip, Mic, Send, Plus, Sparkles, Loader2, Copy } from "lucide-react";
// import { usePlanGenerate } from "../../../hooks/useAiPlannerService";
// import { toast } from "sonner";
// import { ProjectContext } from "../../../context/ProjectContext";

// function AutoTextarea({ value, onChange, onEnter, inputRef, maxPx = 220, onResize }) {
//   const internalRef = useRef(null);
//   const localRef = inputRef ?? internalRef;
//   const rafId = useRef(null);
//   const wasAtEndRef = useRef(true); // track if caret was at end during last input

 
//   const measure = useCallback(
//     (el) => {
//       if (!el) return;
//       el.style.height = "0px";
//       const next = Math.min(el.scrollHeight, maxPx);
//       el.style.height = next + "px";
//       el.style.overflowY = el.scrollHeight > maxPx ? "auto" : "hidden";
//       onResize?.(next);

//       // if user was typing at the end, keep caret and scroll at the end
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
//     // after mount or value change, if focused, keep caret at end when user was at end
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
//     // preserve focus across remounts
//     localRef.current?.focus({ preventScroll: true });
//   }, [localRef]);

//   return (
//     <textarea
//       ref={localRef}
//       value={value}
//       onChange={(e) => {
//         const el = e.target;
//         // remember if the caret was already at the end before we change anything
//         wasAtEndRef.current =
//           el.selectionStart === el.value.length && el.selectionEnd === el.value.length;

//         onChange(el.value);

//         if (rafId.current) cancelAnimationFrame(rafId.current);
//         rafId.current = requestAnimationFrame(() => measure(el));
//       }}
//       onKeyDown={(e) => {
//         if (e.key === "Enter" && !e.shiftKey) {
//           e.preventDefault();
//           onEnter?.();
//         }
//       }}
//       rows={1}
//       placeholder="Ask anything"
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
//           isUser ? "bg-white/10 border-white/20" : "bg-white/[0.06] border-white/15"
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

// export default function CreateProjectAIPlanner({ setFooter, workspaceId, user, onOpenChange }) {
//   const [value, setValue] = useState("");
//   const [isThinking, setIsThinking] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [introMode, setIntroMode] = useState(true);

//   const feedRef = useRef(null);
//   const composerRef = useRef(null);

//   const { mutateAsync: generatePlan } = usePlanGenerate();

//     const projectCtx = useContext(ProjectContext) ?? {};
//     const {
//       refetchProjects = () => {},
//       setCurrentProject = () => {},
//       setProjects = () => {},
//     } = projectCtx;


//   // hysteresis thresholds so layout does not flicker
//   const ENTER_TALL = 80; // go two-row when height >= 80px
//   const EXIT_TALL = 52;  // return to single-row when height <= 52px

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
//     feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
//   }, [messages, isThinking]);

//   useEffect(() => {
//     composerRef.current?.focus({ preventScroll: true });
//   }, []);

//   const suggestions = useMemo(
//     () => ["Create a sprint plan", "Break down features", "Estimate timeline", "Identify risks"],
//     []
//   );

//   const send = useCallback(async () => {
//     const content = value.trim();
//     if (!content || isThinking) return;

//     if (introMode) setIntroMode(false);

//     setValue("");
//     setMessages((p) => [...p, { id: crypto.randomUUID(), role: "user", content }]);
//     setIsThinking(true);

//     const userId= user._id;

//     await new Promise((r) => setTimeout(r, 600));
//     try {
//       const res = await generatePlan({
//         prompt: content,
//         workspaceId: workspaceId,
//         createdBy: userId,
//         countHint: 60,
//       });

//       setMessages(prev => [
//         ...prev,
//         { id: crypto.randomUUID(), role: "assistant", content: JSON.stringify(res.plan, null, 2) },
//       ]);

      
//       setTimeout(() => {
//       toast?.success?.("Project created successfully");
//       onOpenChange?.(false);
//       Promise.resolve(refetchProjects());
//       }, 6000);
    
//     } catch (err) {
//       setMessages(prev => [
//         ...prev,
//         { id: crypto.randomUUID(), role: "assistant", content: "Error: " + err.message },
//       ]);
//     } finally {
//       setIsThinking(false);
//     }
//     // setMessages((p) => [
//     //   ...p,
//     //   {
//     //     id: crypto.randomUUID(),
//     //     role: "assistant",
//     //     content:
//     //       "Here is a first cut. Week 1 discovery and scope. Week 2 architecture and backlog. Weeks 3–5 feature build. Week 6 hardening and release.",
//     //   },
//     // ]);
//     // setIsThinking(false);

//     composerRef.current?.focus({ preventScroll: true });
//   }, [value, introMode, isThinking, generatePlan, workspaceId, user, refetchProjects, onOpenChange]);

//   return (
//     <div className="flex h-[600px] max-h-[85vh] flex-col">
//       {introMode && (
//         <div className="text-center py-10">
//           <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
//             Where should we begin?
//           </h2>
//         </div>
//       )}

//       <div
//         ref={feedRef}
//         className={`flex-1 overflow-y-auto px-4 ${introMode ? "hidden" : ""}`}
//       >
//         <div className="max-w-3xl mx-auto flex flex-col gap-3 pb-44">
//           {messages.map((m) => (
//             <Bubble key={m.id} m={m} />
//           ))}
//           {isThinking && (
//             <div className=" mt-1 flex items-center gap-2 text-sm opacity-80">
//               <Loader2 className="animate-spin" size={16} />
//               thinking
//             </div>
//           )}
//         </div>
//       </div>

//       {/* sticky bottom composer */}
//       <div className="sticky bottom-0 w-full bg-gradient-to-t to-transparent pt-2">
//         <div className="mx-auto w-full max-w-3xl px-3 pb-3 ">
//           {!isTall ? (
//             // compact single-row
//             <div className="flex items-end gap-2 rounded-2xl bg-white/[0.06] p-2 pl-3 border border-white/10 shadow-lg min-h-[44px]">
//               <button
//                 type="button"
//                 className="rounded-full p-2 hover:bg-white/10 flex-shrink-0 h-11 w-11 flex items-center justify-center"
//                 title="Add context"
//                 onClick={() =>
//                   setMessages((prev) => [
//                     ...prev,
//                     {
//                       id: crypto.randomUUID(),
//                       role: "assistant",
//                       content: "Attach specs or paste requirements.",
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
//                   {isThinking ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
//                 </button>
//               </div>
//             </div>
//           ) : (
//             // stable two-row layout
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
//                       setMessages((prev) => [
//                         ...prev,
//                         {
//                           id: crypto.randomUUID(),
//                           role: "assistant",
//                           content: "Attach specs or paste requirements.",
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
//                     {isThinking ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {introMode && (
//             <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
//               {suggestions.map((t) => (
//                 <button
//                   key={t}
//                   type="button"
//                   onClick={() => setValue(t)}
//                   className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
//                 >
//                   <span className="inline-flex items-center gap-1">
//                     <Sparkles size={14} />
//                     {t}
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



























// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import { Paperclip, Mic, Send, Plus, Sparkles, Loader2, Copy } from "lucide-react";

// function AutoTextarea({ value, onChange, onEnter, inputRef, maxPx = 220, onResize }) {
//   const internalRef = useRef(null);
//   const localRef = inputRef ?? internalRef;
//   const rafId = useRef(null);

//   const measure = useCallback(
//     (el) => {
//       if (!el) return;
//       el.style.height = "0px";
//       const next = Math.min(el.scrollHeight, maxPx);
//       el.style.height = next + "px";
//       el.style.overflowY = el.scrollHeight > maxPx ? "auto" : "hidden";
//       onResize?.(next);
//     },
//     [maxPx, onResize]
//   );

//   useEffect(() => {
//     measure(localRef.current);
//     return () => {
//       if (rafId.current) cancelAnimationFrame(rafId.current);
//     };
//   }, [value, measure]);

//   useEffect(() => {
//     localRef.current?.focus({ preventScroll: true });
//   }, []);

//   return (
//     <textarea
//       ref={localRef}
//       value={value}
//       onChange={(e) => {
//         onChange(e.target.value);
//         const el = e.target;
//         if (rafId.current) cancelAnimationFrame(rafId.current);
//         rafId.current = requestAnimationFrame(() => measure(el));
//       }}
//       onKeyDown={(e) => {
//         if (e.key === "Enter" && !e.shiftKey) {
//           e.preventDefault();
//           onEnter?.();
//         }
//       }}
//       rows={1}
//       placeholder="Ask anything"
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
//           isUser ? "bg-white/10 border-white/20" : "bg-white/[0.06] border-white/15"
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

// export default function CreateProjectAIPlanner({ setFooter }) {
//   const [value, setValue] = useState("");
//   const [isThinking, setIsThinking] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [introMode, setIntroMode] = useState(true);

//   const feedRef = useRef(null);
//   const composerRef = useRef(null);

//   // hysteresis thresholds so layout does not flicker
//   const ENTER_TALL = 80; // go two-row when height >= 80px
//   const EXIT_TALL = 52;  // return to single-row when height <= 52px

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
//     feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
//   }, [messages, isThinking]);

//   useEffect(() => {
//     composerRef.current?.focus({ preventScroll: true });
//   }, []);

//   const suggestions = useMemo(
//     () => ["Create a sprint plan", "Break down features", "Estimate timeline", "Identify risks"],
//     []
//   );

//   const send = useCallback(async () => {
//     const content = value.trim();
//     if (!content || isThinking) return;

//     if (introMode) setIntroMode(false);

//     setValue("");
//     setMessages((p) => [...p, { id: crypto.randomUUID(), role: "user", content }]);
//     setIsThinking(true);

//     await new Promise((r) => setTimeout(r, 600));
//     setMessages((p) => [
//       ...p,
//       {
//         id: crypto.randomUUID(),
//         role: "assistant",
//         content:
//           "Here is a first cut. Week 1 discovery and scope. Week 2 architecture and backlog. Weeks 3–5 feature build. Week 6 hardening and release.",
//       },
//     ]);
//     setIsThinking(false);

//     composerRef.current?.focus({ preventScroll: true });
//   }, [value, introMode, isThinking]);

//   return (
//     <div className="flex h-[600px] max-h-[85vh] flex-col">
//       {introMode && (
//         <div className="text-center py-10">
//           <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
//             Where should we begin?
//           </h2>
//         </div>
//       )}

//       <div
//         ref={feedRef}
//         className={`flex-1 overflow-y-auto px-4 ${introMode ? "hidden" : ""}`}
//       >
//         <div className="max-w-3xl mx-auto flex flex-col gap-3 pb-44">
//           {messages.map((m) => (
//             <Bubble key={m.id} m={m} />
//           ))}
//           {isThinking && (
//             <div className="mx-auto mt-1 flex items-center gap-2 text-sm opacity-80">
//               <Loader2 className="animate-spin" size={16} />
//               thinking
//             </div>
//           )}
//         </div>
//       </div>

//       {/* sticky bottom composer */}
//       <div className="sticky bottom-0 w-full bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-2">
//         <div className="mx-auto w-full max-w-3xl px-3 pb-3">
//           {!isTall ? (
//             // compact single-row
//             <div className="flex items-end gap-2 rounded-2xl bg-white/[0.06] p-2 pl-3 border border-white/10 shadow-lg min-h-[44px]">
//               <button
//                 type="button"
//                 className="rounded-full p-2 hover:bg-white/10 flex-shrink-0 h-11 w-11 flex items-center justify-center"
//                 title="Add context"
//                 onClick={() =>
//                   setMessages((prev) => [
//                     ...prev,
//                     {
//                       id: crypto.randomUUID(),
//                       role: "assistant",
//                       content: "Attach specs or paste requirements.",
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
//                   {isThinking ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
//                 </button>
//               </div>
//             </div>
//           ) : (
//             // stable two-row layout
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
//                       setMessages((prev) => [
//                         ...prev,
//                         {
//                           id: crypto.randomUUID(),
//                           role: "assistant",
//                           content: "Attach specs or paste requirements.",
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
//                     {isThinking ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {introMode && (
//             <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
//               {suggestions.map((t) => (
//                 <button
//                   key={t}
//                   type="button"
//                   onClick={() => setValue(t)}
//                   className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
//                 >
//                   <span className="inline-flex items-center gap-1">
//                     <Sparkles size={14} />
//                     {t}
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





























// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Paperclip, Mic, Send, Plus, Sparkles, Loader2, Copy } from "lucide-react";

// export default function CreateProjectAIPlanner({ setFooter }) {
//   const [input, setInput] = useState("");
//   const [isThinking, setIsThinking] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [showIntro, setShowIntro] = useState(true); // heading + center bar visible initially

//   const feedRef = useRef(null);
//   const introInputRef = useRef(null);
//   const composerInputRef = useRef(null);

//   // keep modal footer empty
//   useEffect(() => {
//     setFooter?.(null);
//     return () => setFooter?.(null);
//   }, [setFooter]);

//   // scroll chat feed to bottom on new messages
//   useEffect(() => {
//     if (!feedRef.current) return;
//     feedRef.current.scrollTop = feedRef.current.scrollHeight;
//   }, [messages, isThinking]);

//   // focus ONLY when switching intro -> chat or chat -> intro
//   useEffect(() => {
//     const el = showIntro ? introInputRef.current : composerInputRef.current;
//     el?.focus({ preventScroll: true });
//   }, [showIntro]);

//   const suggestions = useMemo(
//     () => ["Create a sprint plan", "Break down features", "Estimate timeline", "Identify risks"],
//     []
//   );

//   const send = async (text) => {
//     const content = (text ?? input).trim();
//     if (!content || isThinking) return;

//     setInput("");

//     if (showIntro) setShowIntro(false); // move textbox to bottom and hide heading

//     setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }]);
//     setIsThinking(true);

//     // demo reply
//     await new Promise((r) => setTimeout(r, 700));
//     setMessages((prev) => [
//       ...prev,
//       {
//         id: crypto.randomUUID(),
//         role: "assistant",
//         content:
//           "Here is a first cut. Week 1 discovery and scope. Week 2 architecture and backlog. Weeks 3–5 feature build. Week 6 hardening and release.",
//       },
//     ]);
//     setIsThinking(false);
//   };

//   const Bubble = ({ m }) => {
//     const isUser = m.role === "user";
//     return (
//       <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
//         <div
//           className={`max-w-[80%] rounded-2xl border p-3 text-sm leading-relaxed ${
//             isUser ? "bg-white/10 border-white/20" : "bg-white/[0.06] border-white/15"
//           }`}
//         >
//           <div className="flex items-start gap-2">
//             <p className="whitespace-pre-wrap">{m.content}</p>
//             {!isUser && (
//               <button
//                 type="button"
//                 onClick={() => navigator.clipboard.writeText(m.content)}
//                 className="opacity-60 hover:opacity-100"
//                 title="Copy"
//               >
//                 <Copy size={16} />
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     // fixed height container so only the feed scrolls
//     <div className="flex h-[600px] max-h-[85vh] flex-col">
//       {/* Intro header */}
//       <div className={`text-center py-10 ${showIntro ? "" : "hidden"}`} aria-hidden={!showIntro}>
//         <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
//           Where should we begin?
//         </h2>
//       </div>

//       {/* Chat feed (always mounted) */}
//       <div
//         ref={feedRef}
//         className={`flex-1 overflow-y-auto px-4 ${showIntro ? "hidden" : ""}`}
//         aria-hidden={showIntro}
//       >
//         <div className="max-w-3xl mx-auto flex flex-col gap-3 pb-24">
//           {messages.map((m) => (
//             <Bubble key={m.id} m={m} />
//           ))}
//           {isThinking && (
//             <div className="mx-auto mt-1 flex items-center gap-2 text-sm opacity-80">
//               <Loader2 className="animate-spin" size={16} />
//               thinking
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Intro ask bar (always mounted, just hidden later) */}
//       <div className={`pb-10 ${showIntro ? "" : "hidden"}`} aria-hidden={!showIntro}>
//         <div className="mx-auto w-full max-w-3xl">
//           <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] p-2 pl-3 border border-white/10 shadow-lg">
//             <button className="rounded-full p-2 hover:bg-white/10" title="Add context">
//               <Plus size={18} />
//             </button>

//             <input
//               ref={introInputRef}
//               className="flex-1 bg-transparent outline-none h-12 px-2 text-base placeholder:text-white/50"
//               placeholder="Ask anything"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" && !e.shiftKey) {
//                   e.preventDefault();
//                   send();
//                 }
//               }}
//             />

//             <button
//               type="button"
//               onClick={() => send()}
//               className="rounded-full p-2 hover:bg-white/10"
//               title="Send"
//             >
//               <Send size={18} />
//             </button>
//           </div>

//           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
//             {suggestions.map((t) => (
//               <button
//                 key={t}
//                 type="button"
//                 onClick={() => send(t)}
//                 className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
//               >
//                 <span className="inline-flex items-center gap-1">
//                   <Sparkles size={14} />
//                   {t}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Bottom composer (always mounted, just hidden until first send) */}
//       <div
//         className={`mx-auto w-full max-w-3xl px-1 pb-2 pt-2 sticky bottom-0 bg-transparent ${
//           showIntro ? "hidden" : ""
//         }`}
//         aria-hidden={showIntro}
//       >
//         <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] p-2 pl-3 border border-white/10 shadow-lg">
//           <button className="rounded-full p-2 hover:bg-white/10" title="Add context">
//             <Plus size={18} />
//           </button>

//           <input
//             ref={composerInputRef}
//             className="flex-1 bg-transparent outline-none h-11 px-2 text-base placeholder:text-white/50"
//             placeholder="Ask anything"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" && !e.shiftKey) {
//                 e.preventDefault();
//                 send();
//               }
//             }}
//           />

//           <button type="button" className="rounded-full p-2 hover:bg-white/10" title="Voice">
//             <Mic size={18} />
//           </button>
//           <button type="button" className="rounded-full p-2 hover:bg-white/10" title="Attach">
//             <Paperclip size={18} />
//           </button>
//           <button
//             type="button"
//             onClick={() => send()}
//             disabled={isThinking}
//             className="rounded-full p-2 hover:bg-white/10"
//             title="Send"
//           >
//             {isThinking ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


























// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Paperclip, Mic, Send, Plus, Sparkles, Loader2, Copy } from "lucide-react";

// export default function CreateProjectAIPlanner({ setFooter }) {
//   const [input, setInput] = useState("");
//   const [isThinking, setIsThinking] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [showIntro, setShowIntro] = useState(true);

//   const introInputRef = useRef(null);
//   const composerInputRef = useRef(null);
//   const feedRef = useRef(null);

//   // modal footer ko blank rakho
//   useEffect(() => {
//     setFooter?.(null);
//     return () => setFooter?.(null);
//   }, [setFooter]);

//   // scroll to bottom
//   useEffect(() => {
//     if (feedRef.current) {
//       feedRef.current.scrollTop = feedRef.current.scrollHeight;
//     }
//   }, [messages, isThinking]);

//   // ALWAYS keep focus on the active input (intro vs composer)
//   useEffect(() => {
//     const el = showIntro ? introInputRef.current : composerInputRef.current;
//     el?.focus({ preventScroll: true });
//   }, [showIntro, messages, isThinking]);

//   const suggestions = useMemo(
//     () => ["Create a sprint plan", "Break down features", "Estimate timeline", "Identify risks"],
//     []
//   );

//   const send = async (text) => {
//     const content = (text ?? input).trim();
//     if (!content || isThinking) return;
//     setInput("");

//     if (showIntro) setShowIntro(false);

//     setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }]);
//     setIsThinking(true);

//     // demo response
//     await new Promise((r) => setTimeout(r, 700));
//     const reply =
//       "Here is a first cut. Week 1 discovery and scope. Week 2 architecture and backlog. Weeks 3–5 feature build. Week 6 hardening and release.";
//     setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
//     setIsThinking(false);
//   };

//   const Bubble = ({ m }) => {
//     const isUser = m.role === "user";
//     return (
//       <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
//         <div className={`max-w-[80%] rounded-2xl border p-3 text-sm leading-relaxed ${
//           isUser ? "bg-white/10 border-white/20" : "bg-white/[0.06] border-white/15"
//         }`}>
//           <div className="flex items-start gap-2">
//             <p className="whitespace-pre-wrap">{m.content}</p>
//             {!isUser && (
//               <button
//                 type="button"
//                 onClick={() => navigator.clipboard.writeText(m.content)}
//                 className="opacity-60 hover:opacity-100"
//                 title="Copy"
//               >
//                 <Copy size={16} />
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const IntroBar = () => (
//     <div className="mx-auto w-full max-w-3xl">
//       <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] p-2 pl-3 border border-white/10 shadow-lg">
//         <button
//           type="button"
//           className="rounded-full p-2 hover:bg-white/10"
//           title="Add context"
//           onClick={() =>
//             setMessages((prev) => [
//               ...prev,
//               { id: crypto.randomUUID(), role: "assistant", content: "Attach specs or paste requirements." },
//             ])
//           }
//         >
//           <Plus size={18} />
//         </button>

//         <input
//           ref={introInputRef}
//           autoFocus
//           className="flex-1 bg-transparent outline-none h-12 px-2 text-base placeholder:text-white/50"
//           placeholder="Ask anything"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === "Enter" && !e.shiftKey) {
//               e.preventDefault();
//               send();
//             }
//           }}
//         />

//         <div className="flex items-center gap-1 pr-1">
//           <button type="button" className="rounded-full p-2 hover:bg-white/10" title="Voice">
//             <Mic size={18} />
//           </button>
//           <button type="button" className="rounded-full p-2 hover:bg-white/10" title="Attach">
//             <Paperclip size={18} />
//           </button>
//           <button type="button" className="rounded-full p-2 hover:bg-white/10" title="Send" onClick={() => send()} disabled={isThinking}>
//             {isThinking ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
//           </button>
//         </div>
//       </div>

//       <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
//         {suggestions.map((t) => (
//           <button
//             key={t}
//             type="button"
//             onClick={() => send(t)}
//             className="rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
//           >
//             <span className="inline-flex items-center gap-1">
//               <Sparkles size={14} />
//               {t}
//             </span>
//           </button>
//         ))}
//       </div>
//     </div>
//   );

//   const BottomComposer = () => (
//     <div className="mx-auto w-full max-w-3xl px-1 pb-1 pt-3 sticky bottom-0 bg-transparent">
//       <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] p-2 pl-3 border border-white/10 shadow-lg">
//         <button
//           type="button"
//           className="rounded-full p-2 hover:bg-white/10"
//           title="Add context"
//           onClick={() =>
//             setMessages((prev) => [
//               ...prev,
//               { id: crypto.randomUUID(), role: "assistant", content: "Attach specs or paste requirements." },
//             ])
//           }
//         >
//           <Plus size={18} />
//         </button>

//         <input
//           ref={composerInputRef}
//           autoFocus
//           className="flex-1 bg-transparent outline-none h-11 px-2 text-base placeholder:text-white/50"
//           placeholder="Ask anything"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === "Enter" && !e.shiftKey) {
//               e.preventDefault();
//               send();
//             }
//           }}
//         />

//         <div className="flex items-center gap-1 pr-1">
//           <button type="button" className="rounded-full p-2 hover:bg-white/10" title="Voice">
//             <Mic size={18} />
//           </button>
//           <button type="button" className="rounded-full p-2 hover:bg-white/10" title="Attach">
//             <Paperclip size={18} />
//           </button>
//           <button type="button" className="rounded-full p-2 hover:bg-white/10" title="Send" onClick={() => send()} disabled={isThinking}>
//             {isThinking ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="flex h-full min-h-[520px] flex-col">
//       <div className="py-10 text-center">
//         <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Where should we begin?</h2>
//       </div>

//       {showIntro ? (
//         <div className="pb-10">
//           <IntroBar />
//         </div>
//       ) : (
//         <>
//           <div
//             ref={feedRef}
//             className="mx-auto w-full max-w-3xl flex-1 overflow-auto rounded-xl border border-white/10 bg-white/[0.03] p-4"
//           >
//             <div className="flex flex-col gap-3">
//               {messages.map((m) => (
//                 <Bubble key={m.id} m={m} />
//               ))}
//               {isThinking && (
//                 <div className="mx-auto mt-1 flex items-center gap-2 text-sm opacity-80">
//                   <Loader2 className="animate-spin" size={16} />
//                   thinking
//                 </div>
//               )}
//             </div>
//           </div>
//           <BottomComposer />
//         </>
//       )}
//     </div>
//   );
// }














// import React from 'react'

// function CreateProjectAIPlanner() {
//   return (
//     <div>
//         Cteate Project AI Planner
//     </div>
//   )
// }

// export default CreateProjectAIPlanner
