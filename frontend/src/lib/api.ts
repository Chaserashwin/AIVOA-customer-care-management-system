import type { ChatFinalResponse, ComplaintFields, ComplaintSummary, RiskAssessment, UploadResponse } from "@/types/complaint";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

type StreamHandlers = {
  onStatus?: (step: string, message: string) => void;
  onToken?: (token: string) => void;
  onFinal?: (response: ChatFinalResponse) => void;
};

export async function streamChat(
  payload: {
    message: string;
    conversation_id?: string;
    complaint: ComplaintFields;
  },
  handlers: StreamHandlers,
) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Chat request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      const event = JSON.parse(line);
      if (event.type === "status") {
        handlers.onStatus?.(event.step, event.message);
      }
      if (event.type === "token") {
        handlers.onToken?.(event.content);
      }
      if (event.type === "final") {
        handlers.onFinal?.(event as ChatFinalResponse);
      }
    }
  }
}

export async function uploadComplaint(file: File, conversationId?: string): Promise<UploadResponse> {
  const data = new FormData();
  data.append("file", file);
  const url = new URL(`${API_BASE}/upload`);
  if (conversationId) {
    url.searchParams.set("conversation_id", conversationId);
  }
  const response = await fetch(url, {
    method: "POST",
    body: data,
  });
  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
  return response.json();
}

export async function saveComplaint(payload: {
  fields: ComplaintFields;
  risk: RiskAssessment;
  summary: ComplaintSummary;
}) {
  const response = await fetch(`${API_BASE}/complaints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Save failed with status ${response.status}`);
  }
  return response.json() as Promise<{ id: string }>;
}

