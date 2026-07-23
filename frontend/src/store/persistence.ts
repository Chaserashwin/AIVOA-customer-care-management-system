import type { ComplaintState } from "@/store/slices/complaintSlice";

const KEY = "aivoa.complaintState.v1";

export function loadComplaintState(): ComplaintState | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ComplaintState) : undefined;
  } catch {
    return undefined;
  }
}

export function saveComplaintState(state: ComplaintState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Local persistence should never block the complaint workflow.
  }
}

