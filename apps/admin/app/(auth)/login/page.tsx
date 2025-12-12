import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-8 rounded-3xl border border-border/80 bg-card p-8 shadow-soft">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">Access</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Log in</h1>
        <p className="text-sm text-foreground/60">
          Continue to your editorial dashboard.
        </p>
      </div>
      <AuthForm mode="login" />
      <p className="text-sm text-foreground/60">
        Access is limited to existing admin accounts. Sign-up is disabled.
      </p>
    </div>
  );
}

