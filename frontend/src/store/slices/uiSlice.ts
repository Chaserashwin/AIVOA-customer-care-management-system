import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info" | "warning";
}

interface UiState {
  toasts: Toast[];
}

const initialState: UiState = {
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    pushToast(state, action: PayloadAction<Toast>) {
      state.toasts.push(action.payload);
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { dismissToast, pushToast } = uiSlice.actions;
export default uiSlice.reducer;
