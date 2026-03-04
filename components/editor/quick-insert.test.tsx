import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QuickInsert } from "./quick-insert";

vi.mock("lucide-react", () => ({
  Command: ({ className }: { className?: string }) => <svg className={className} />
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    variant,
    type
  }: {
    children: React.ReactNode;
    variant?: string;
    type?: "button" | "submit";
  }) => (
    <button type={type} data-variant={variant}>
      {children}
    </button>
  )
}));

const IconStub = ({ className }: { className?: string }) => <svg className={className} />;

describe("components/editor/quick-insert.tsx", () => {
  it("renders the quick insert trigger and keeps menu closed by default", () => {
    const html = renderToStaticMarkup(
      <QuickInsert
        commands={[
          {
            id: "heading",
            label: "Heading",
            icon: IconStub,
            surfaces: ["quick-insert"],
            run: () => undefined
          }
        ]}
      />
    );

    expect(html).toContain(">Quick insert<");
    expect(html).toContain("data-variant=\"outline\"");
    expect(html).not.toContain(">Heading<");
  });
});
