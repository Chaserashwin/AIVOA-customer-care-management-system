import { describe, expect, it } from "vitest";

import { emptyComplaintFields, requiredFields } from "@/types/complaint";

describe("complaint field model", () => {
  it("keeps required fields inside the editable complaint shape", () => {
    for (const field of requiredFields) {
      expect(field in emptyComplaintFields).toBe(true);
    }
  });
});

