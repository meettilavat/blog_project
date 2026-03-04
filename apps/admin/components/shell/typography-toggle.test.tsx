import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UiEnvironmentProvider } from "@/components/ui/ui-environment";
import TypographyToggle from "./typography-toggle";

describe("apps/admin/components/shell/typography-toggle.tsx", () => {
  it("renders button label from ui environment state", () => {
    const html = renderToStaticMarkup(
      <UiEnvironmentProvider>
        <TypographyToggle />
      </UiEnvironmentProvider>
    );

    expect(html).toContain("Switch to serif font");
    expect(html).toContain(">sans<");
  });
});
