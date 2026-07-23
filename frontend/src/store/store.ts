import { configureStore } from "@reduxjs/toolkit";

import aiReducer from "@/store/slices/aiSlice";
import chatReducer from "@/store/slices/chatSlice";
import complaintReducer from "@/store/slices/complaintSlice";
import uiReducer from "@/store/slices/uiSlice";
import uploadReducer from "@/store/slices/uploadSlice";
import { clearComplaintSessionPersistence } from "@/store/persistence";

clearComplaintSessionPersistence();

export const store = configureStore({
  reducer: {
    ai: aiReducer,
    chat: chatReducer,
    complaint: complaintReducer,
    upload: uploadReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
