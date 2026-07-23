import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissToast } from "@/store/slices/uiSlice";
import { cn } from "@/lib/utils";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function Toaster() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = icons[toast.variant ?? "info"];
        return (
          <div
            key={toast.id}
            className={cn(
              "flex gap-3 rounded-lg border bg-white p-4 shadow-panel",
              toast.variant === "error" && "border-rose-200",
              toast.variant === "success" && "border-emerald-200",
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4", toast.variant === "error" ? "text-rose-500" : "text-emerald-600")} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{toast.title}</div>
              {toast.description ? <div className="mt-1 text-xs text-slate-500">{toast.description}</div> : null}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => dispatch(dismissToast(toast.id))}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

