import { Navigate, Route, Routes } from "react-router-dom";

import { ComplaintWorkspace } from "@/features/complaints/ComplaintWorkspace";
import { Toaster } from "@/components/Toaster";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<ComplaintWorkspace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

