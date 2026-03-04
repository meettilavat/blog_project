import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  useFormStateMock: vi.fn(),
  useFormStatusMock: vi.fn(),
  signInActionMock: vi.fn(),
  formActionMock: vi.fn()
}));

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...actual,
    useFormState: (...args: unknown[]) => mocks.useFormStateMock(...args),
    useFormStatus: () => mocks.useFormStatusMock()
  };
});

vi.mock("@/lib/actions/auth", () => ({
  signInAction: mocks.signInActionMock
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    isLoading,
    disabled,
    type,
    className
  }: {
    children: React.ReactNode;
    isLoading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit";
    className?: string;
  }) => (
    <button
      type={type}
      className={className}
      data-loading={String(Boolean(isLoading))}
      data-disabled={String(Boolean(disabled || isLoading))}
      aria-busy={isLoading ? "true" : undefined}
      disabled={Boolean(disabled || isLoading)}
    >
      {children}
    </button>
  )
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({
    children,
    ...props
  }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props}>{children}</label>
}));

import { AuthForm } from "./auth-form";

describe("components/auth/auth-form.tsx", () => {
  beforeEach(() => {
    mocks.useFormStateMock.mockReset();
    mocks.useFormStatusMock.mockReset();
    mocks.signInActionMock.mockReset();
    mocks.formActionMock.mockReset();

    mocks.useFormStateMock.mockReturnValue([{}, mocks.formActionMock]);
    mocks.useFormStatusMock.mockReturnValue({ pending: false });
  });

  it("renders login fields and submit button", () => {
    const html = renderToStaticMarkup(<AuthForm />);

    expect(mocks.useFormStateMock).toHaveBeenCalledWith(mocks.signInActionMock, {});
    expect(html).toContain("for=\"login-email\"");
    expect(html).toContain("name=\"email\"");
    expect(html).toContain("placeholder=\"hi@example.com\"");
    expect(html).toContain("name=\"password\"");
    expect(html).toContain("type=\"submit\"");
    expect(html).toContain("data-loading=\"false\"");
    expect(html).toContain("data-disabled=\"false\"");
    expect(html).toContain(">Sign in<");
  });

  it("shows action errors and loading state while submitting", () => {
    mocks.useFormStateMock.mockReturnValue([{ error: "Invalid credentials" }, mocks.formActionMock]);
    mocks.useFormStatusMock.mockReturnValue({ pending: true });

    const html = renderToStaticMarkup(<AuthForm />);

    expect(html).toContain("Invalid credentials");
    expect(html).toContain("data-loading=\"true\"");
    expect(html).toContain("data-disabled=\"true\"");
    expect(html).toContain("aria-busy=\"true\"");
  });
});
