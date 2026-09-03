import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <h1 className="mb-1 text-center text-2xl font-bold text-orange-600">
        🔥 Survivor 51 League
      </h1>
      <p className="mb-6 text-center text-sm text-neutral-500">
        Enter the league password to get in.
      </p>
      <LoginForm next={next ?? "/"} />
    </div>
  );
}
