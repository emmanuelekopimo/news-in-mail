import nodemailer from "nodemailer";

export type Delivery = { via: "smtp" | "inbox"; error?: string };

/**
 * Sends through SMTP when SMTP_URL is set (for example a Gmail app password or
 * a Resend/Brevo SMTP URL). Without it, emails are kept in the in-app inbox so
 * the demo works with no mail account.
 */
export async function deliver(to: string, mail: { subject: string; html: string; text: string }): Promise<Delivery> {
  const url = process.env.SMTP_URL;
  if (!url) return { via: "inbox" };
  try {
    const transport = nodemailer.createTransport(url);
    await transport.sendMail({
      from: process.env.MAIL_FROM ?? "News in Mail <no-reply@newsinmail.local>",
      to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    return { via: "smtp" };
  } catch (err) {
    return { via: "smtp", error: (err as Error).message };
  }
}
