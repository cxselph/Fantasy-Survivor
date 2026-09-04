import { requireAdmin } from "@/lib/auth";
import { getSmtpSettingsForDisplay } from "@/lib/actions/smtp-settings";
import { BackToAdmin } from "@/components/back-to-admin";
import { EmailSettingsForm } from "./email-settings-form";
import { TestEmailForm } from "./test-email-form";

export default async function AdminEmailSettingsPage() {
  await requireAdmin();
  const settings = await getSmtpSettingsForDisplay();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Email Settings</h1>
        <BackToAdmin />
      </div>
      <p className="rounded-2xl bg-white/90 px-4 py-3 text-sm text-neutral-500 shadow-lg backdrop-blur-sm">
        SMTP configuration used to send invite and password-reset emails. The password is
        encrypted at rest and never shown here once saved.
      </p>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">SMTP Server</h2>
        <EmailSettingsForm settings={settings} />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Send Test Email</h2>
        <p className="mb-3 text-sm text-neutral-500">
          Confirm delivery is working without waiting for a real invite or reset.
        </p>
        <TestEmailForm />
      </section>
    </div>
  );
}
