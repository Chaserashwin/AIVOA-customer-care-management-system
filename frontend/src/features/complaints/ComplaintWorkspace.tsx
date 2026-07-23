import { useEffect } from "react";
import { FlaskConical, RotateCcw, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopilotPanel } from "@/features/complaints/components/CopilotPanel";
import { ComplaintFormPanel } from "@/features/complaints/components/ComplaintFormPanel";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearHighlights, resetComplaint, undoLastCorrection } from "@/store/slices/complaintSlice";
import { pushToast } from "@/store/slices/uiSlice";

export function ComplaintWorkspace() {
  const dispatch = useAppDispatch();
  const { highlightedFields, history, status } = useAppSelector((state) => state.complaint);

  useEffect(() => {
    if (highlightedFields.length === 0) {
      return;
    }
    const timeout = window.setTimeout(() => dispatch(clearHighlights()), 3600);
    return () => window.clearTimeout(timeout);
  }, [dispatch, highlightedFields.length]);

  return (
    <main className="h-[100dvh] overflow-hidden px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full max-w-[1480px] flex-col gap-5 overflow-hidden">
        <header className="shrink-0 flex flex-col gap-4 border-b bg-white/70 pb-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-normal">Log Customer Complaint</h1>
              <p className="text-sm text-slate-500">API & FDF Quality Assurance Module</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <Button
              variant="outline"
              size="sm"
              disabled={history.length === 0}
              onClick={() => {
                dispatch(undoLastCorrection());
                dispatch(
                  pushToast({
                    id: crypto.randomUUID(),
                    title: "Correction undone",
                    description: "The previous complaint field values were restored.",
                    variant: "info",
                  }),
                );
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                dispatch(resetComplaint());
                dispatch(
                  pushToast({
                    id: crypto.randomUUID(),
                    title: "Workspace cleared",
                    description: "Complaint form and risk assessment were reset.",
                    variant: "info",
                  }),
                );
              }}
            >
              Reset
            </Button>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 grid-rows-[minmax(360px,1fr)_minmax(420px,1fr)] gap-0 overflow-hidden rounded-lg border bg-white shadow-panel lg:grid-cols-[minmax(0,1.35fr)_minmax(390px,0.9fr)] lg:grid-rows-1">
          <ComplaintFormPanel />
          <CopilotPanel />
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Ready to Commit") {
    return (
      <Badge variant="success" className="gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        Ready to Commit
      </Badge>
    );
  }
  if (status === "Committed") {
    return (
      <Badge variant="default" className="gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        Committed
      </Badge>
    );
  }
  return <Badge variant="warning">Pending Triage</Badge>;
}
