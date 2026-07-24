import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissToast } from "@/store/slices/uiSlice";
import type { RootState } from "@/store/store";
import { cn } from "@/lib/utils";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const AUTO_DISMISS_MS = 4000;
const EXIT_ANIMATION_MS = 220;

export function Toaster() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);
  const handleDismiss = useCallback((id: string) => dispatch(dismissToast(id)), [dispatch]);

  return (
    <div className="fixed left-3 right-3 top-3 z-50 flex max-w-[calc(100vw-1.5rem)] flex-col gap-3 sm:left-auto sm:right-4 sm:top-4 sm:w-[360px] sm:max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}

type ToastModel = RootState["ui"]["toasts"][number];

function ToastItem({ toast, onDismiss }: { toast: ToastModel; onDismiss: (id: string) => void }) {
  const Icon = icons[toast.variant ?? "info"];
  const [isExiting, setIsExiting] = useState(false);
  const timeoutRef = useRef<number>();
  const exitTimeoutRef = useRef<number>();
  const startedAtRef = useRef(0);
  const remainingMsRef = useRef(AUTO_DISMISS_MS);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const beginDismiss = useCallback(() => {
    clearTimer();
    setIsExiting(true);
    exitTimeoutRef.current = window.setTimeout(() => onDismiss(toast.id), EXIT_ANIMATION_MS);
  }, [clearTimer, onDismiss, toast.id]);

  const startTimer = useCallback(() => {
    clearTimer();
    startedAtRef.current = Date.now();
    timeoutRef.current = window.setTimeout(beginDismiss, remainingMsRef.current);
  }, [beginDismiss, clearTimer]);

  useEffect(() => {
    remainingMsRef.current = AUTO_DISMISS_MS;
    startTimer();

    return () => {
      clearTimer();
      if (exitTimeoutRef.current) {
        window.clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [clearTimer, startTimer, toast.id]);

  function handleMouseEnter() {
    if (isExiting) {
      return;
    }
    clearTimer();
    const elapsedMs = Date.now() - startedAtRef.current;
    remainingMsRef.current = Math.max(250, remainingMsRef.current - elapsedMs);
  }

  function handleMouseLeave() {
    if (!isExiting) {
      startTimer();
    }
  }

  function handleClose() {
    beginDismiss();
  }

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border bg-white p-4 shadow-panel transition-all duration-200 ease-out",
        "animate-in fade-in slide-in-from-top-2",
        isExiting && "-translate-y-2 opacity-0",
        toast.variant === "error" && "border-rose-200",
        toast.variant === "success" && "border-emerald-200",
        toast.variant === "warning" && "border-amber-200",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4",
          toast.variant === "error" && "text-rose-500",
          toast.variant === "warning" && "text-amber-500",
          toast.variant !== "error" && toast.variant !== "warning" && "text-emerald-600",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{toast.title}</div>
        {toast.description ? <div className="mt-1 text-xs text-slate-500">{toast.description}</div> : null}
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
