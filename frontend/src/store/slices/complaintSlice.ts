import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  ChatFinalResponse,
  ComplaintFieldKey,
  ComplaintFields,
  ComplaintSummary,
  emptyComplaintFields,
  emptyRiskAssessment,
  emptySummary,
  RiskAssessment,
} from "@/types/complaint";

export interface ComplaintState {
  fields: ComplaintFields;
  risk: RiskAssessment;
  summary: ComplaintSummary;
  highlightedFields: ComplaintFieldKey[];
  status: "Pending Triage" | "Ready to Commit" | "Committed";
  history: ComplaintFields[];
  committedId?: string;
}

const initialState: ComplaintState = {
  fields: emptyComplaintFields,
  risk: emptyRiskAssessment,
  summary: emptySummary,
  highlightedFields: [],
  status: "Pending Triage",
  history: [],
};

const complaintSlice = createSlice({
  name: "complaint",
  initialState,
  reducers: {
    updateField(
      state,
      action: PayloadAction<{
        field: ComplaintFieldKey;
        value: string;
      }>,
    ) {
      state.fields[action.payload.field] = action.payload.value;
      state.status = "Pending Triage";
    },
    applyAiResult(state, action: PayloadAction<ChatFinalResponse>) {
      const updated = action.payload.updated_fields ?? [];
      if (updated.length > 0) {
        state.history.push({ ...state.fields });
      }
      state.fields = action.payload.complaint;
      state.risk = action.payload.risk;
      state.summary = action.payload.summary;
      state.highlightedFields = updated;
      state.status = action.payload.status === "Ready to Commit" ? "Ready to Commit" : "Pending Triage";
    },
    clearHighlights(state) {
      state.highlightedFields = [];
    },
    resetComplaint(state) {
      state.fields = emptyComplaintFields;
      state.risk = emptyRiskAssessment;
      state.summary = emptySummary;
      state.highlightedFields = [];
      state.status = "Pending Triage";
      state.history = [];
      state.committedId = undefined;
    },
    undoLastCorrection(state) {
      const previous = state.history.pop();
      if (!previous) {
        return;
      }
      state.fields = previous;
      state.highlightedFields = [];
      state.status = "Pending Triage";
    },
    markCommitted(state, action: PayloadAction<string>) {
      state.status = "Committed";
      state.committedId = action.payload;
    },
  },
});

export const { applyAiResult, clearHighlights, markCommitted, resetComplaint, undoLastCorrection, updateField } =
  complaintSlice.actions;
export default complaintSlice.reducer;

