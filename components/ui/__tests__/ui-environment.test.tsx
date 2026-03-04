import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UiEnvironmentProvider, useUiEnvironment } from "@/components/ui/ui-environment";

function UiEnvironmentSnapshot() {
  const { headerOffset, typographyStyle } = useUiEnvironment();
  return (
    <div
      data-offset={headerOffset}
      data-style={typographyStyle}
    />
  );
}

describe("components/ui/ui-environment.tsx", () => {
  it("provides a server-safe environment snapshot", () => {
    const html = renderToStaticMarkup(
      <UiEnvironmentProvider>
        <UiEnvironmentSnapshot />
      </UiEnvironmentProvider>
    );

    expect(html).toContain('data-offset="0"');
    expect(html).toContain('data-style="sans"');
  });

  it("throws when hooks are used outside the provider", () => {
    expect(() => renderToStaticMarkup(<UiEnvironmentSnapshot />)).toThrow(
      "useHeaderOffset must be used within UiEnvironmentProvider."
    );
  });
});
