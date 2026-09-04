import { AcceptInviteForm } from "./accept-invite-form";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur">
        <h1 className="font-display mb-1 text-center text-3xl tracking-wide text-accent-600">
          🔥 Welcome to the League
        </h1>
        {token ? (
          <>
            <p className="mb-6 text-center text-sm text-neutral-500">
              Set a password to finish creating your account.
            </p>
            <AcceptInviteForm token={token} />
          </>
        ) : (
          <p className="text-center text-sm text-red-600">This link is invalid or has expired.</p>
        )}
      </div>
    </div>
  );
}
