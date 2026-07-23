import { z } from "zod";

export const complaintSchema = z.object({
  complaint_source: z.string(),
  customer_name: z.string(),
  product_name: z.string(),
  product_strength: z.string(),
  batch_lot_number: z.string(),
  manufacturing_date: z.string(),
  expiry_date: z.string(),
  affected_quantity: z.string(),
  facility: z.string(),
  material: z.string(),
  complaint_category: z.string(),
  complaint_description: z.string(),
});

export type ComplaintFormValues = z.infer<typeof complaintSchema>;

