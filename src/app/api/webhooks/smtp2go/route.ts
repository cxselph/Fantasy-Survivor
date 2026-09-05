import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/users";

// SMTP2GO's bounce webhook - a *hard or soft bounce is reported asynchronously*, well after
// sendEmail() already returned "sent" (a bounce only exists because the receiving server first
// accepted the message for relay, then rejected it later). Registered in the SMTP2GO dashboard
// under Settings -> Webhooks (Output type: JSON, Events: at least "Bounce"), pointed at this
// route with HTTP Basic Auth credentials matching SMTP2GO_WEBHOOK_USER/PASS below - SMTP2GO
// doesn't sign requests, so Basic Auth (which its webhook form supports natively) is what
// verifies a request actually came from them rather than an arbitrary caller.
//
// This ties bounce tracking specifically to SMTP2GO - switching SMTP providers later means
// re-registering an equivalent webhook there (or leaving bounce tracking off; send-status
// tracking in src/lib/actions/users.ts is provider-agnostic and keeps working regardless).
function isAuthorized(request: Request): boolean {
  const expectedUser = process.env.SMTP2GO_WEBHOOK_USER;
  const expectedPass = process.env.SMTP2GO_WEBHOOK_PASS;
  if (!expectedUser || !expectedPass) return false;

  const match = /^Basic (.+)$/.exec(request.headers.get("authorization") || "");
  if (!match) return false;

  let user: string, pass: string;
  try {
    [user = "", pass = ""] = Buffer.from(match[1], "base64").toString("utf8").split(":");
  } catch {
    return false;
  }

  return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass);
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}

type BounceEvent = {
  event?: string;
  rcpt?: string;
  bounce?: "hard" | "soft";
  message?: string;
  host?: string;
  time?: string;
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: BounceEvent;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  // Acknowledge (rather than 4xx) anything that isn't a bounce for a known user, so SMTP2GO
  // doesn't keep retrying - that includes other event types, in case the dashboard's webhook
  // ends up configured for more than just "Bounce", and invite emails sent before this feature
  // shipped, whose recipient may no longer match any User row.
  if (body.event !== "bounce" || !body.rcpt) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(body.rcpt) } });
  if (!user) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const kind = body.bounce === "soft" ? "Soft bounce" : "Hard bounce";
  const detail = [body.message, body.host && `(reported by ${body.host})`].filter(Boolean).join(" ");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastInviteEmailStatus: "BOUNCED",
      lastInviteEmailError: detail ? `${kind}: ${detail}` : kind,
      lastInviteEmailAt: body.time ? new Date(body.time) : new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
