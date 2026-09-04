import { redirect } from "next/navigation";
import { hasRealAdmin } from "@/lib/actions/bootstrap";
import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  if (await hasRealAdmin()) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur">
        <h1 className="font-display mb-1 text-center text-3xl tracking-wide text-accent-600">
          🔥 Set Up Admin
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-500">
          One-time setup: prove you have the commissioner password, then create the first real
          admin account.
        </p>
        <SetupForm />
      </div>
    </div>
  );
}
