import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ChatMessage } from "@/types/complaint";

interface ChatState {
  messages: ChatMessage[];
  conversationId?: string;
  thinking: boolean;
}

const initialState: ChatState = {
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Ready to process new complaints. You can paste the raw email from the customer, or upload a PDF of the complaint report. I will extract the data and run the initial risk assessment.",
      createdAt: new Date().toISOString(),
      status: "done",
    },
  ],
  thinking: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    appendAssistantToken(state, action: PayloadAction<{ id: string; token: string }>) {
      const message = state.messages.find((item) => item.id === action.payload.id);
      if (message) {
        message.content += action.payload.token;
        message.status = "streaming";
      }
    },
    finalizeMessage(state, action: PayloadAction<{ id: string; content?: string; status?: ChatMessage["status"] }>) {
      const message = state.messages.find((item) => item.id === action.payload.id);
      if (message) {
        message.content = action.payload.content ?? message.content;
        message.status = action.payload.status ?? "done";
      }
    },
    setConversationId(state, action: PayloadAction<string>) {
      state.conversationId = action.payload;
    },
    setThinking(state, action: PayloadAction<boolean>) {
      state.thinking = action.payload;
    },
  },
});

export const { addMessage, appendAssistantToken, finalizeMessage, setConversationId, setThinking } = chatSlice.actions;
export default chatSlice.reducer;

