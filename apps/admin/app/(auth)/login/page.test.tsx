import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/auth/auth-form", () => ({
  AuthForm: function AuthFormStub() {
    return <div>AuthFormStub</div>;
  }
}));

import LoginPage from "./page";

describe("apps/admin/app/(auth)/login/page.tsx", () => {
  it("renders login copy and the auth form container", () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain("Log in");
    expect(html).toContain("Continue to your editorial dashboard.");
    expect(html).toContain("Access is limited to existing admin accounts.");
    expect(html).toContain("AuthFormStub");
  });
});
