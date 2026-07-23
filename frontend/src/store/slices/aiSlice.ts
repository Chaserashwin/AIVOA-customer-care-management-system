import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AiState {
  isStreaming: boolean;
  phase: string;
  steps: string[];
  error?: string;
}

const initialState: AiState = {
  isStreaming: false,
  phase: "idle",
  steps: [],
};

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    startAi(state) {
      state.isStreaming = true;
      state.phase = "intent_detection";
      state.steps = [];
      state.error = undefined;
    },
    addAiStep(state, action: PayloadAction<string>) {
      state.phase = action.payload;
      state.steps.push(action.payload);
    },
    finishAi(state) {
      state.isStreaming = false;
      state.phase = "idle";
    },
    failAi(state, action: PayloadAction<string>) {
      state.isStreaming = false;
      state.phase = "error";
      state.error = action.payload;
    },
  },
});

export const { addAiStep, failAi, finishAi, startAi } = aiSlice.actions;
export default aiSlice.reducer;

