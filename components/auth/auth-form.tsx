"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInAction, signUpAction, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  mode: "login" | "signup";
};

const initialState: AuthState = {};

export function AuthForm({ mode }: Props) {
  const action = mode === "login" ? signInAction : signUpAction;
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          name="email"
          type="email"
          placeholder="hi@example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input id={`${mode}-password`} name="password" type="password" minLength={6} required />
      </div>
      {state?.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <SubmitButton>{mode === "login" ? "Sign in" : "Sign up"}</SubmitButton>
    </form>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full uppercase tracking-[0.2em]" isLoading={pending}>
      {children}
    </Button>
  );
}

export default AuthForm;
