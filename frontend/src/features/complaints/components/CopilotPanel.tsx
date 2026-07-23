import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  Upload,
  User,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { streamChat, uploadComplaint } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addAiStep, failAi, finishAi, startAi } from "@/store/slices/aiSlice";
import { addMessage, appendAssistantToken, finalizeMessage, setConversationId, setThinking } from "@/store/slices/chatSlice";
import { applyAiResult } from "@/store/slices/complaintSlice";
import { failUpload, finishUpload, setUploadProgress, startUpload } from "@/store/slices/uploadSlice";
import { pushToast } from "@/store/slices/uiSlice";
import { ChatMessage } from "@/types/complaint";

const prompts = [
  "Apollo Pharmacy reported discolored capsules in Amoxicillin Capsules 500 mg. Batch number AMX240602. Manufacturing date March 2026. Expiry date February 2028. Affected quantity 12 capsules.",
  "ah sorry the batch number is BMX240602 and affected quantity is 48 capsules",
  "Why is severity Critical?",
];

export function CopilotPanel() {
  const dispatch = useAppDispatch();
  const { messages, conversationId, thinking } = useAppSelector((state) => state.chat);
  const fields = useAppSelector((state) => state.complaint.fields);
  const ai = useAppSelector((state) => state.ai);
  const upload = useAppSelector((state) => state.upload);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages, thinking, upload.progress]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await sendMessage(input);
  }

  async function sendMessage(raw: string) {
    const message = raw.trim();
    if (!message || ai.isStreaming) {
      return;
    }

    setInput("");
    const assistantId = createId();
    dispatch(addMessage(makeMessage("user", message)));
    dispatch(addMessage({ ...makeMessage("assistant", ""), id: assistantId, status: "streaming" }));
    dispatch(startAi());
    dispatch(setThinking(true));

    try {
      await streamChat(
        {
          message,
          conversation_id: conversationId,
          complaint: fields,
        },
        {
          onStatus: (step) => dispatch(addAiStep(step)),
          onToken: (token) => dispatch(appendAssistantToken({ id: assistantId, token })),
          onFinal: (response) => {
            dispatch(applyAiResult(response));
            dispatch(setConversationId(response.conversation_id));
            dispatch(finalizeMessage({ id: assistantId, content: response.assistant_response, status: "done" }));
            dispatch(
              pushToast({
                id: createId(),
                title: response.intent === "correction" ? "Fields corrected" : "AI extraction complete",
                description:
                  response.updated_fields.length > 0
                    ? `${response.updated_fields.length} field(s) synced to the form.`
                    : "No form fields were changed.",
                variant: "success",
              }),
            );
          },
        },
      );
      dispatch(finishAi());
    } catch (error) {
      const description = error instanceof Error ? error.message : "Unable to reach the AI service.";
      dispatch(failAi(description));
      dispatch(finalizeMessage({ id: assistantId, content: description, status: "error" }));
      dispatch(pushToast({ id: createId(), title: "AI request failed", description, variant: "error" }));
    } finally {
      dispatch(setThinking(false));
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || upload.isUploading || ai.isStreaming) {
      return;
    }

    const assistantId = createId();
    dispatch(addMessage({ ...makeMessage("user", `Uploaded ${file.name}`), attachment: { name: file.name, type: file.type || "file" } }));
    dispatch(addMessage({ ...makeMessage("assistant", ""), id: assistantId, status: "streaming" }));
    dispatch(startUpload(file.name));
    dispatch(startAi());
    dispatch(setThinking(true));

    let progress = 8;
    const timer = window.setInterval(() => {
      progress = Math.min(progress + 12, 82);
      dispatch(setUploadProgress(progress));
    }, 280);

    try {
      const response = await uploadComplaint(file, conversationId);
      window.clearInterval(timer);
      dispatch(setUploadProgress(100));
      dispatch(finishUpload());
      dispatch(applyAiResult(response.result));
      dispatch(setConversationId(response.result.conversation_id));
      dispatch(finalizeMessage({ id: assistantId, content: response.result.assistant_response, status: "done" }));
      dispatch(finishAi());
      dispatch(
        pushToast({
          id: createId(),
          title: "Document parsed",
          description: `${response.file_name} was extracted and synced to the complaint form.`,
          variant: "success",
        }),
      );
    } catch (error) {
      window.clearInterval(timer);
      const description = error instanceof Error ? error.message : "Document extraction failed.";
      dispatch(failUpload(description));
      dispatch(failAi(description));
      dispatch(finalizeMessage({ id: assistantId, content: description, status: "error" }));
      dispatch(pushToast({ id: createId(), title: "Upload failed", description, variant: "error" }));
    } finally {
      dispatch(setThinking(false));
    }
  }

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-t bg-slate-50/80 lg:border-l lg:border-t-0">
      <div className="shrink-0 flex items-start justify-between border-b bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold">AIVOA Copilot</h2>
            <p className="text-xs text-slate-500">Drop complaint files or paste text below.</p>
          </div>
        </div>
        <div className={cn("mt-1 h-2.5 w-2.5 rounded-full", ai.isStreaming ? "bg-primary" : "bg-emerald-500")} />
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {upload.isUploading ? <UploadProgress fileName={upload.fileName} progress={upload.progress} /> : null}
          {thinking ? <ThinkingIndicator phase={ai.phase} /> : null}
        </div>
      </div>

      <div className="shrink-0 border-t bg-white px-4 py-3">
        <PromptSuggestions disabled={ai.isStreaming || upload.isUploading} onSelect={sendMessage} />
        <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
          <input
            ref={fileRef}
            className="hidden"
            type="file"
            accept=".pdf,.docx,.txt,.eml,.png,.jpg,.jpeg,.tif,.tiff,.bmp"
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Upload complaint file"
            onClick={() => fileRef.current?.click()}
            disabled={ai.isStreaming || upload.isUploading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex min-h-10 flex-1 items-center rounded-md border border-primary/40 bg-white px-3 focus-within:ring-2 focus-within:ring-primary/15">
            <input
              className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
              placeholder="Type a message or paste a complaint..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={ai.isStreaming || upload.isUploading}
            />
          </div>
          <Button type="submit" size="icon" aria-label="Send message" disabled={!input.trim() || ai.isStreaming || upload.isUploading}>
            {ai.isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-normal text-slate-400">
          Powered by LangGraph
        </div>
      </div>
    </aside>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser ? (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Zap className="h-4 w-4" />
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[82%] rounded-lg border px-4 py-3 text-sm leading-relaxed shadow-sm",
          isUser ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-700",
          message.status === "error" && "border-rose-200 bg-rose-50 text-rose-700",
        )}
      >
        {message.attachment ? (
          <div className={cn("mb-2 flex items-center gap-2 rounded-md px-3 py-2", isUser ? "bg-white/15" : "bg-slate-50")}>
            <FileText className="h-4 w-4" />
            <span className="truncate text-xs font-semibold">{message.attachment.name}</span>
          </div>
        ) : null}
        {message.content || (message.status === "streaming" ? <TypingDots /> : null)}
      </div>
      {isUser ? (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
          <User className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );
}

function PromptSuggestions({ disabled, onSelect }: { disabled: boolean; onSelect: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt, index) => (
        <Button
          key={prompt}
          type="button"
          variant="secondary"
          size="sm"
          className="max-w-full truncate"
          disabled={disabled}
          title={prompt}
          onClick={() => onSelect(prompt)}
        >
          {index === 0 ? <Sparkles className="mr-1.5 h-3.5 w-3.5" /> : null}
          {index === 0 ? "Paste demo complaint" : index === 1 ? "Apply correction" : "Ask risk reason"}
        </Button>
      ))}
    </div>
  );
}

function ThinkingIndicator({ phase }: { phase: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="font-medium">{phase.replace(/_/g, " ")}</span>
      <TypingDots />
    </div>
  );
}

function UploadProgress({ fileName, progress }: { fileName?: string; progress: number }) {
  return (
    <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <Upload className="h-4 w-4 text-primary" />
          <span className="truncate">{fileName ?? "Complaint document"}</span>
        </div>
        {progress >= 100 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
      </div>
      <Progress value={progress} />
      <div className="mt-2 text-xs text-slate-500">
        {progress < 100 ? "Extracting tabular data via OCR..." : "Document extraction complete"}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current" />
    </span>
  );
}

function makeMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: createId(),
    role,
    content,
    createdAt: new Date().toISOString(),
    status: "done",
  };
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
