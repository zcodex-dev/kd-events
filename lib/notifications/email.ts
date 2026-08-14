import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export function isEmail(str: string): boolean {
  // Simple regex for basic email detection
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str.trim());
}

export async function sendConfirmationEmail(
  recipientEmail: string,
  eventTitle: string,
  name: string
) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is missing. Skipping email.');
      return;
    }

    // Once your domain is verified in Resend, this will send official emails!
    const fromEmail = 'events@kompongdewa.win';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px;">
        <h2 style="color: #c3943a; text-align: center;">Registration Confirmed!</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for enrolling in <strong>${eventTitle}</strong>.</p>
        <p>Your registration has been successfully received by our system and our receptionist will process your request shortly.</p>
        <br />
        <p>We look forward to seeing you at Kompong Dewa Integrated Resort.</p>
        <hr style="border: none; border-top: 1px solid #eaeaec; margin: 20px 0;" />
        <p style="font-size: 12px; color: #8898aa; text-align: center;">
          This is an automated message, please do not reply.
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: `Kompong Dewa Events <${fromEmail}>`,
      to: [recipientEmail],
      subject: `Enrollment Confirmed: ${eventTitle}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend Error:', error);
    } else {
      console.log('Email sent successfully:', data);
    }
  } catch (err) {
    console.error('Error in sendConfirmationEmail:', err);
  }
}
