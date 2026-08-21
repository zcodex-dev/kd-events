import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_to_prevent_build_crash');

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
      ? `<div style="text-align: center; margin-bottom: 20px; background-color: #0b0b0b;"><img src="${eventImageUrl}" alt="Event Artwork" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px 8px 0 0; display: block;" /></div>`
      : '';

    const whatsappUrl = 'https://wa.link/yn724f';
    const telegramUrl = 'https://t.me/KompongDewaMarketing';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Enrollment Confirmation</title>
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          ${imageHtml}
          
          <div style="padding: 28px 24px 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="display: inline-block; background-color: #fef8ec; color: #c3943a; border: 1px solid #fae6be; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; rounded: 20px; border-radius: 20px;">Registration Received</span>
            </div>

            <h2 style="color: #111827; font-size: 22px; font-weight: 800; text-align: center; margin: 0 0 16px 0; letter-spacing: -0.5px;">
              Enrollment Confirmed!
            </h2>

            <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 12px 0;">
              Dear <strong>${name}</strong>,
            </p>

            <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 16px 0;">
              Thank you for enrolling in <strong>${eventTitle}</strong>. Your registration has been successfully received by our team.
            </p>

            <!-- Verification Action Box -->
            <div style="margin: 24px 0; padding: 20px; background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 10px; text-align: center;">
              <p style="margin: 0 0 14px 0; font-size: 14px; font-weight: 700; color: #1c1917;">
                ⚡ Direct Verify Your Enrollment:
              </p>
              <p style="margin: 0 0 18px 0; font-size: 13px; color: #78716c; line-height: 1.4;">
                Connect with our team directly via WhatsApp or Telegram for instant verification & event pass confirmation:
              </p>

              <!-- Buttons Container -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 440px;">
                <tr>
                  <td align="center" style="padding: 6px;">
                    <a href="${whatsappUrl}" target="_blank" style="display: block; background-color: #25d366; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 18px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(37,211,102,0.3);">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          <td style="vertical-align: middle; padding-right: 8px;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="18" height="18" alt="WhatsApp" style="display: block; filter: brightness(0) invert(1);" />
                          </td>
                          <td style="vertical-align: middle; color: #ffffff; font-size: 13px; font-weight: 700;">
                            Verify via WhatsApp
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                  <td align="center" style="padding: 6px;">
                    <a href="${telegramUrl}" target="_blank" style="display: block; background-color: #0088cc; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 18px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,136,204,0.3);">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          <td style="vertical-align: middle; padding-right: 8px;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" width="18" height="18" alt="Telegram" style="display: block; filter: brightness(0) invert(1);" />
                          </td>
                          <td style="vertical-align: middle; color: #ffffff; font-size: 13px; font-weight: 700;">
                            Verify via Telegram
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                </tr>
              </table>
            </div>

            <p style="font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5;">
              We look forward to welcoming you at <strong>Kompong Dewa Integrated Resort</strong>.
            </p>
          </div>

          <div style="background-color: #0b0b0b; color: #9ca3af; padding: 20px 24px; text-align: center; border-top: 1px solid #1f2937;">
            <a href="https://www.kompongdewa.com" target="_blank" style="color: #c3943a; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">www.kompongdewa.com</a>
            <p style="font-size: 11px; color: #6b7280; margin: 8px 0 0 0;">
              Sihanoukville, Cambodia • This is an automated message, please do not reply.
            </p>
          </div>
        </div>
      </body>
      </html>
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
