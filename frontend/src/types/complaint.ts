export type ComplaintFieldKey =
  | "complaint_source"
  | "customer_name"
  | "product_name"
  | "product_strength"
  | "batch_lot_number"
  | "manufacturing_date"
  | "expiry_date"
  | "affected_quantity"
  | "facility"
  | "material"
  | "complaint_category"
  | "complaint_description";

export type ComplaintFields = Record<ComplaintFieldKey, string>;

export interface RiskAssessment {
  severity: string;
  priority: string;
  initial_risk: string;
  suggested_next_action: string;
  confidence_score: number;
  reasoning: string;
  root_cause_recommendation: string;
  suggested_capa: string;
  suggested_investigation: string;
}

export interface CompletenessReport {
  score: number;
  missing_fields: string[];
  ready_to_commit: boolean;
}

export interface ComplaintSummary {
  title: string;
  narrative: string;
  duplicate_score: number;
  completeness: CompletenessReport;
  root_cause_recommendation: string;
  suggested_capa: string;
  suggested_investigation: string;
}

export interface ChatFinalResponse {
  conversation_id: string;
  intent: string;
  assistant_response: string;
  complaint: ComplaintFields;
  risk: RiskAssessment;
  summary: ComplaintSummary;
  updated_fields: ComplaintFieldKey[];
  status: string;
  redux_sync: Record<string, unknown>;
}

export interface UploadResponse {
  file_name: string;
  file_type: string;
  extracted_text_preview: string;
  result: ChatFinalResponse;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  createdAt: string;
  status?: "streaming" | "done" | "error";
  attachment?: {
    name: string;
    type: string;
  };
}

export const emptyComplaintFields: ComplaintFields = {
  complaint_source: "",
  customer_name: "",
  product_name: "",
  product_strength: "",
  batch_lot_number: "",
  manufacturing_date: "",
  expiry_date: "",
  affected_quantity: "",
  facility: "",
  material: "",
  complaint_category: "",
  complaint_description: "",
};

export const emptyRiskAssessment: RiskAssessment = {
  severity: "",
  priority: "",
  initial_risk: "",
  suggested_next_action: "",
  confidence_score: 0,
  reasoning: "",
  root_cause_recommendation: "",
  suggested_capa: "",
  suggested_investigation: "",
};

export const emptySummary: ComplaintSummary = {
  title: "",
  narrative: "",
  duplicate_score: 0,
  completeness: {
    score: 0,
    missing_fields: [],
    ready_to_commit: false,
  },
  root_cause_recommendation: "",
  suggested_capa: "",
  suggested_investigation: "",
};

export const fieldLabels: Record<ComplaintFieldKey, string> = {
  complaint_source: "Complaint Source",
  customer_name: "Customer Name",
  product_name: "Product Name",
  product_strength: "Product Strength/Grade",
  batch_lot_number: "Batch / Lot Number",
  manufacturing_date: "Manufacturing Date",
  expiry_date: "Expiry Date",
  affected_quantity: "Affected Quantity",
  facility: "Originating Site Block",
  material: "Impacted Non-Product Materials (NPM)",
  complaint_category: "Complaint Category",
  complaint_description: "Complaint Description",
};

export const requiredFields: ComplaintFieldKey[] = [
  "complaint_source",
  "customer_name",
  "product_name",
  "product_strength",
  "batch_lot_number",
  "affected_quantity",
  "complaint_category",
  "complaint_description",
];

