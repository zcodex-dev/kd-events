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
  name: string,
  eventImageUrl?: string
) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is missing. Skipping email.');
      return;
    }

    // Once your domain is verified in Resend, this will send official emails!
    const fromEmail = 'no-reply@kompongdewa.win';

    const imageHtml = eventImageUrl 
      ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${eventImageUrl}" alt="Event Artwork" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>`
      : '';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaec; border-radius: 8px; overflow: hidden;">
        <div style="padding: 20px; background-color: #ffffff;">
          ${imageHtml}
          <h2 style="color: #c3943a; text-align: center; margin-top: 0;">Enrollment Confirmed!</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for enrolling in <strong>${eventTitle}</strong>.</p>
          <p>Your enrollment has been successfully received by our system and our receptionist will process your request shortly.</p>
          <br />
          <p>We look forward to seeing you at Kompong Dewa Integrated Resort.</p>
        </div>
        <div style="background-color: #000000; color: #ffffff; padding: 20px; text-align: center;">
          <a href="https://www.kompongdewa.com" style="color: #c3943a; text-decoration: none; font-weight: bold; font-size: 16px;">www.kompongdewa.com</a>
          <p style="font-size: 12px; color: #888888; margin-top: 10px; margin-bottom: 0;">
            This is an automated message, please do not reply.
          </p>
        </div>
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
