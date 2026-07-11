import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("lucide-react", () => ({
  Printer: ({ className }: { className?: string }) => (
    <svg className={className} data-icon="printer" />
  )
}));

import { PrintResumeButton, printResume } from "./print-resume-button";

describe("components/profile/print-resume-button.tsx", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders an accessible print action", () => {
    const html = renderToStaticMarkup(<PrintResumeButton />);

    expect(html).toContain("Print resume");
    expect(html).toContain('type="button"');
  });

  it("opens the browser print dialog", () => {
    const print = vi.fn();
    vi.stubGlobal("window", { print });

    printResume();

    expect(print).toHaveBeenCalledTimes(1);
  });
});
