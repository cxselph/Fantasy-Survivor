import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur">
        <h1 className="font-display mb-1 text-center text-3xl tracking-wide text-accent-600">
          Forgot Password
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-500">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
