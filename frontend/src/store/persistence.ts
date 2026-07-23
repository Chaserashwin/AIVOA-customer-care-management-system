const TRANSIENT_SESSION_KEYS = ["aivoa.complaintState.v1"];

export function clearComplaintSessionPersistence() {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of TRANSIENT_SESSION_KEYS) {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // Storage cleanup is best-effort and should never block app startup.
    }
  }
}
