"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");
  const safeNext = next.startsWith("/") ? next : "/";

  if (!password) {
    return { error: "Enter the league password." };
  }

  if (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
    await createSession("admin");
    redirect(safeNext);
  }

  if (process.env.SITE_PASSWORD && password === process.env.SITE_PASSWORD) {
    await createSession("guest");
    redirect(safeNext);
  }

  return { error: "Incorrect password." };
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
