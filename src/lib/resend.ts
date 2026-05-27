import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export function getResend() {
  return resend;
}

export function canSendEmails(): boolean {
  const key = process.env.RESEND_API_KEY;
  return !!key && key !== "re_...";
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

export const INSTITUTIONAL_EMAIL =
  process.env.INSTITUTIONAL_EMAIL ?? "admin@circulokinesiologos.com";
