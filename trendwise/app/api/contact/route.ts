import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * Instantiated lazily.
 *
 * `new Resend(process.env.RESEND_API_KEY!)` used to run at module scope, so if
 * RESEND_API_KEY was missing the constructor threw while `next build` was
 * collecting page data — failing the whole deployment, not just the contact
 * form.
 */
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (resendClient) return resendClient;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  resendClient = new Resend(key);
  return resendClient;
}

/** Values are interpolated into HTML, so they must be escaped. */
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );

const MAX_MESSAGE_LENGTH = 5000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = body ?? {};

    if (!name || !email || !message) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ message: 'Invalid field types' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Invalid email address' }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { message: `Message must be under ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 }
      );
    }

    const safeName = escapeHtml(name.slice(0, 120));
    const safeEmail = escapeHtml(email.slice(0, 254));
    const safeMessage = escapeHtml(message.slice(0, MAX_MESSAGE_LENGTH)).replace(/\n/g, '<br />');

    await getResend().emails.send({
      from: 'TrendWise <no-reply@obiorachibuike.com>', // Replace with a verified sender
      to: process.env.CONTACT_INBOX || 'obiorachibuike22@gmail.com',
      subject: `New contact form submission from ${name.slice(0, 120)}`,
      replyTo: email,
      html: `
    <p><strong>Name:</strong> ${safeName}</p>
    <p><strong>Email:</strong> ${safeEmail}</p>
    <p><strong>Message:</strong></p>
    <p>${safeMessage}</p>
  `,
    });

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Resend email error:', error?.message ?? error);
    return NextResponse.json({ message: 'Failed to send email' }, { status: 500 });
  }
}
