import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UploadState {
  isUploading: boolean;
  progress: number;
  fileName?: string;
  error?: string;
}

const initialState: UploadState = {
  isUploading: false,
  progress: 0,
};

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    startUpload(state, action: PayloadAction<string>) {
      state.isUploading = true;
      state.progress = 8;
      state.fileName = action.payload;
      state.error = undefined;
    },
    setUploadProgress(state, action: PayloadAction<number>) {
      state.progress = action.payload;
    },
    finishUpload(state) {
      state.isUploading = false;
      state.progress = 100;
    },
    failUpload(state, action: PayloadAction<string>) {
      state.isUploading = false;
      state.error = action.payload;
    },
  },
});

export const { failUpload, finishUpload, setUploadProgress, startUpload } = uploadSlice.actions;
export default uploadSlice.reducer;

