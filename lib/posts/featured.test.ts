import { describe, expect, it } from "vitest";
import { FEATURED_POST_SLUG, entryType, ENTRY_TYPE_LABEL } from "./featured";

describe("entryType", () => {
  it("classifies the featured slug as a case study", () => {
    expect(entryType(FEATURED_POST_SLUG)).toBe("case-study");
    expect(entryType({ slug: FEATURED_POST_SLUG })).toBe("case-study");
  });
  it("classifies everything else as a field note", () => {
    expect(entryType("some-other-post")).toBe("field-note");
  });
  it("exposes human labels", () => {
    expect(ENTRY_TYPE_LABEL["case-study"]).toBe("Case study");
    expect(ENTRY_TYPE_LABEL["field-note"]).toBe("Field note");
  });
});
