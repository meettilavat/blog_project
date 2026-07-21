import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReadingProgress } from "./reading-progress";
import { UiEnvironmentProvider } from "@/components/ui/ui-environment";

describe("components/content/reading-progress.tsx", () => {
  it("renders the progress container and bar with expected markers", () => {
    const html = renderToStaticMarkup(
      <UiEnvironmentProvider>
        <ReadingProgress className="custom-progress" offset={48} />
      </UiEnvironmentProvider>
    );

    expect(html).toContain("data-reading-progress");
    expect(html).toContain("data-reading-progress-bar");
    expect(html).toContain("custom-progress");
    expect(html).toContain("h-[2px]");
    expect(html).toContain("bg-accent");
  });
});
