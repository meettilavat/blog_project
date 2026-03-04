"use server";

import { createSupabaseServerClientOrThrow } from "@/lib/supabase/clients/next-request-client";
import { getErrorMessage } from "@/lib/errors/get-error-message";
import { redirect } from "next/navigation";

type AuthState = {
  error?: string;
};

export async function signInAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();

  let supabase;
  try {
    supabase = await createSupabaseServerClientOrThrow({ access: "write" });
  } catch (error: unknown) {
    return { error: getErrorMessage(error, "Supabase is not configured.") };
  }
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClientOrThrow({ access: "write" });
  await supabase.auth.signOut();
  redirect("/");
}
