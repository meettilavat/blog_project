import { describe, expect, it } from "vitest";
import { formatDate, isSignificantlyUpdated } from "./date";

describe("lib/typography/date.ts", () => {
  it("formats date strings", () => {
    const formatted = formatDate("2024-01-02T00:00:00.000Z");
    expect(formatted).toContain("2024");
    expect(formatDate()).toBe("");
  });

  it("detects updates that exceed one day", () => {
    expect(
      isSignificantlyUpdated("2024-01-01T00:00:00.000Z", "2024-01-03T00:00:00.000Z")
    ).toBe(true);
    expect(
      isSignificantlyUpdated("2024-01-01T00:00:00.000Z", "2024-01-01T12:00:00.000Z")
    ).toBe(false);
  });
});
