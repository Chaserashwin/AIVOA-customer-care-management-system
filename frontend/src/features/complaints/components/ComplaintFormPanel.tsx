import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardCheck, FlaskConical, PackageCheck, ShieldAlert, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { saveComplaint } from "@/lib/api";
import { cn } from "@/lib/utils";
import { complaintSchema, ComplaintFormValues } from "@/schemas/complaintSchema";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { markCommitted, updateField } from "@/store/slices/complaintSlice";
import { pushToast } from "@/store/slices/uiSlice";
import { ComplaintFieldKey, fieldLabels, requiredFields } from "@/types/complaint";

const sections: Array<{
  title: string;
  icon: typeof ClipboardCheck;
  fields: Array<{ key: ComplaintFieldKey; placeholder: string; multiline?: boolean }>;
}> = [
  {
    title: "1. Origin & Customer Details",
    icon: ClipboardCheck,
    fields: [
      { key: "complaint_source", placeholder: "Awaiting source..." },
      { key: "customer_name", placeholder: "Awaiting customer..." },
    ],
  },
  {
    title: "2. Product & Batch Identification",
    icon: PackageCheck,
    fields: [
      { key: "product_name", placeholder: "Awaiting AI extraction..." },
      { key: "product_strength", placeholder: "Awaiting AI extraction..." },
      { key: "batch_lot_number", placeholder: "Awaiting AI extraction..." },
      { key: "affected_quantity", placeholder: "Awaiting AI extraction..." },
      { key: "manufacturing_date", placeholder: "Awaiting AI extraction..." },
      { key: "expiry_date", placeholder: "Awaiting AI extraction..." },
    ],
  },
  {
    title: "3. Facility & Material Impact",
    icon: FlaskConical,
    fields: [
      { key: "facility", placeholder: "Awaiting AI classification..." },
      { key: "material", placeholder: "e.g., Primary packaging..." },
    ],
  },
  {
    title: "4. Defect Analysis",
    icon: ShieldAlert,
    fields: [
      { key: "complaint_category", placeholder: "Awaiting AI classification..." },
      {
        key: "complaint_description",
        placeholder: "AI will synthesize the complaint into a formal QMS description...",
        multiline: true,
      },
    ],
  },
];

export function ComplaintFormPanel() {
  const dispatch = useAppDispatch();
  const { fields, highlightedFields, risk, summary, status } = useAppSelector((state) => state.complaint);
  const { formState } = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    values: fields,
  });

  const completion = useMemo(() => {
    const completed = requiredFields.filter((field) => fields[field]?.trim()).length;
    return Math.round((completed / requiredFields.length) * 100);
  }, [fields]);

  async function handleCommit() {
    try {
      const record = await saveComplaint({ fields, risk, summary });
      dispatch(markCommitted(record.id));
      dispatch(
        pushToast({
          id: crypto.randomUUID(),
          title: "Complaint committed",
          description: "The complaint record was saved to the QMS ledger.",
          variant: "success",
        }),
      );
    } catch (error) {
      dispatch(
        pushToast({
          id: crypto.randomUUID(),
          title: "Commit failed",
          description: error instanceof Error ? error.message : "Unable to save the complaint.",
          variant: "error",
        }),
      );
    }
  }

  return (
    <div className="h-full min-h-0 min-w-0 overflow-y-auto px-5 py-6 md:px-7">
      <div className="mb-6 grid gap-3 rounded-lg border bg-slate-50 p-4 sm:grid-cols-[1fr_220px]">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Intake Completeness
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {summary.completeness.missing_fields.length > 0
              ? `${summary.completeness.missing_fields.length} required field(s) need confirmation.`
              : "Required intake fields are populated."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={summary.completeness.score ? summary.completeness.score * 100 : completion} />
          <span className="w-10 text-right text-sm font-semibold">
            {Math.round(summary.completeness.score ? summary.completeness.score * 100 : completion)}%
          </span>
        </div>
      </div>

      <form className="space-y-7">
        {sections.map((section) => (
          <section key={section.title}>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-slate-500">
              <section.icon className="h-4 w-4 text-primary" />
              {section.title}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <FieldControl
                  key={field.key}
                  field={field.key}
                  value={fields[field.key]}
                  placeholder={field.placeholder}
                  multiline={field.multiline}
                  highlighted={highlightedFields.includes(field.key)}
                  className={field.multiline ? "sm:col-span-2" : undefined}
                  onChange={(value) => dispatch(updateField({ field: field.key, value }))}
                />
              ))}
            </div>
          </section>
        ))}

        <RiskAssessmentCard riskReady={Boolean(risk.severity)} />

        <Button
          type="button"
          className="h-11 w-full"
          disabled={status === "Committed" || !risk.severity}
          onClick={handleCommit}
        >
          <ClipboardCheck className="mr-2 h-4 w-4" />
          {status === "Committed" ? "Committed to QMS Ledger" : "Commit to QMS Ledger"}
        </Button>
        {Object.keys(formState.errors).length > 0 ? (
          <p className="text-xs text-rose-600">Please review highlighted validation issues before commit.</p>
        ) : null}
      </form>
    </div>
  );
}

function FieldControl({
  field,
  value,
  placeholder,
  multiline,
  highlighted,
  className,
  onChange,
}: {
  field: ComplaintFieldKey;
  value: string;
  placeholder: string;
  multiline?: boolean;
  highlighted: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  const commonClass = cn(
    "w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15",
    highlighted && "field-highlight border-emerald-400 bg-emerald-50",
  );

  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{fieldLabels[field]}</span>
      {multiline ? (
        <textarea
          className={cn(commonClass, "min-h-[112px] resize-y")}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input className={commonClass} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function RiskAssessmentCard({ riskReady }: { riskReady: boolean }) {
  const risk = useAppSelector((state) => state.complaint.risk);
  const ai = useAppSelector((state) => state.ai);

  if (!riskReady && !ai.isStreaming) {
    return null;
  }

  return (
    <section className="rounded-lg border border-primary/10 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
        <ShieldAlert className="h-4 w-4" />
        AI copilot risk assessment
      </div>
      {ai.isStreaming && !risk.severity ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine className="sm:col-span-2" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyValue label="Severity (Suggested)" value={risk.severity} />
          <ReadOnlyValue label="Priority" value={risk.priority} />
          <ReadOnlyValue label="Suggested Next Action" value={risk.suggested_next_action} />
          <ReadOnlyValue label="Confidence" value={`${Math.round(risk.confidence_score * 100)}%`} />
          <ReadOnlyValue className="sm:col-span-2" label="Initial Risk Assessment" value={risk.initial_risk} />
        </div>
      )}
    </section>
  );
}

function ReadOnlyValue({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-semibold text-slate-500">{label}</div>
      <div className="min-h-10 rounded-md border bg-white px-3 py-2 text-sm">{value || "Awaiting AI assessment..."}</div>
    </div>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-10 animate-pulse rounded-md bg-white/80", className)} />;
}
