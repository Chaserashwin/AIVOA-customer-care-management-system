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
    <main className="min-h-[100dvh] overflow-x-hidden px-3 py-3 text-slate-950 sm:px-4 sm:py-4 md:px-5 lg:h-[100dvh] lg:overflow-hidden lg:px-8 lg:py-5">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-[1480px] flex-col gap-3 overflow-visible sm:min-h-[calc(100dvh-2rem)] sm:gap-4 lg:h-full lg:min-h-0 lg:gap-5 lg:overflow-hidden">
        <header className="shrink-0 flex flex-col gap-3 border-b bg-white/70 pb-3 backdrop-blur md:flex-row md:items-center md:justify-between lg:gap-4 lg:pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-normal sm:text-xl">Log Customer Complaint</h1>
              <p className="text-sm text-slate-500">API & FDF Quality Assurance Module</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <div className="col-span-2 sm:col-span-1">
              <StatusBadge status={status} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 lg:min-h-0"
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
              className="min-h-11 lg:min-h-0"
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

        <section className="flex min-w-0 flex-1 flex-col gap-0 overflow-visible rounded-lg border bg-white shadow-panel lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(390px,0.9fr)] lg:overflow-hidden">
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
      <Badge variant="success" className="w-full justify-center gap-1.5 sm:w-auto">
        <ShieldCheck className="h-3.5 w-3.5" />
        Ready to Commit
      </Badge>
    );
  }
  if (status === "Committed") {
    return (
      <Badge variant="default" className="w-full justify-center gap-1.5 sm:w-auto">
        <ShieldCheck className="h-3.5 w-3.5" />
        Committed
      </Badge>
    );
  }
  return (
    <Badge variant="warning" className="w-full justify-center sm:w-auto">
      Pending Triage
    </Badge>
  );
}
