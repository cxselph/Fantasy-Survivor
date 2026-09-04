import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur">
        <h1 className="font-display mb-1 text-center text-3xl tracking-wide text-orange-600">
          Reset Password
        </h1>
        {token ? (
          <>
            <p className="mb-6 text-center text-sm text-neutral-500">Choose a new password.</p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <p className="text-center text-sm text-red-600">
            This link is invalid or has expired.{" "}
            <Link href="/forgot-password" className="font-medium underline">
              Request a new one
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
