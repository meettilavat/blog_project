"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthState = {
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
    supabase = await createSupabaseServerClient(true);
  } catch (error: any) {
    return { error: error.message || "Supabase is not configured." };
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

export async function signUpAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  return { error: "Sign-up is disabled. Contact the admin to provision access." };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient(true);
  await supabase.auth.signOut();
  redirect("/");
}
