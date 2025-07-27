// This is a mock email service for demonstration purposes
// In a real application, you would use a service like SendGrid, Mailgun, etc.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailTemplate = "purchase-confirmation" | "implementation-tips"

export interface EmailOptions {
  to: string
  subject?: string
  template: EmailTemplate
  variables?: Record<string, any>
}

export interface ScheduledEmailOptions extends EmailOptions {
  delay: string // e.g., '24h', '2d'
}

export interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
}

export interface ThankYouEmailData {
  customerEmail: string;
  customerName?: string;
  sessionId: string;
  amount: number;
  currency: string;
}

export interface AbandonedCartEmailData {
  customerEmail: string;
  customerName?: string;
  recoveryUrl: string;
  discountCode?: string;
  expiresAt: number;
}

/**
 * Send an email using the specified template and variables
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log(`Sending email to ${options.to} using template ${options.template}`)
  console.log("Variables:", options.variables)

  // In a real implementation, this would call your email service API
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Email sent to ${options.to}`)
      resolve(true)
    }, 500)
  })
}

/**
 * Schedule an email to be sent after a delay
 */
export async function scheduleEmail(options: ScheduledEmailOptions): Promise<boolean> {
  console.log(`Scheduling email to ${options.to} with delay ${options.delay}`)

  // In a real implementation, this would use a task queue or scheduling service
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Email scheduled for ${options.to}`)
      resolve(true)
    }, 500)
  })
}

/**
 * Generate a secure access token for email links
 */
export function generateSecureToken(): string {
  // In a real implementation, this would generate a cryptographically secure token
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Send a purchase confirmation email with access links
 */
export async function sendPurchaseConfirmationEmail(email: string, accessToken: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Your Style Guide is Ready!",
    template: "purchase-confirmation",
    variables: {
      accessLink: `https://styleguideai.com/preview?token=${accessToken}`,
      downloadLinks: {
        pdf: `https://styleguideai.com/download/pdf?token=${accessToken}`,
        markdown: `https://styleguideai.com/download/md?token=${accessToken}`,
        docx: `https://styleguideai.com/download/docx?token=${accessToken}`,
        html: `https://styleguideai.com/download/html?token=${accessToken}`,
      },
    },
  })
}

class EmailService {
  async sendEmail(data: EmailData) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.log('⚠️ RESEND_API_KEY not set - email not sent:', data.subject);
        return { success: false, error: 'No API key configured' };
      }

      const result = await resend.emails.send({
        from: 'Tahi from AIStyleGuide <support@aistyleguide.com>',
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
        react: data.react,
      });

      console.log('✅ Email sent successfully:', result.data?.id);
      return { success: true, id: result.data?.id };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendThankYouEmail(data: ThankYouEmailData) {
    const subject = 'Thank you for downloading AI Style Guide!';
    const html = this.generateThankYouEmailHTML(data);
    const text = this.generateThankYouEmailText(data);

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  async sendAbandonedCartEmail(data: AbandonedCartEmailData) {
    const subject = 'Generate Your Style Guide - 20% Off';
    const html = this.generateAbandonedCartEmailHTML(data);
    const text = this.generateAbandonedCartEmailText(data);

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
      text,
    });
  }

  private generateThankYouEmailHTML(data: ThankYouEmailData): string {
    const firstName = data.customerName ? data.customerName.split(' ')[0] : 'there';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank you for downloading AI Style Guide!</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <p style="margin-bottom: 20px;">Hey ${firstName},</p>
          
          <p style="margin-bottom: 15px;">I'm Tahi — I built AI Style Guide because I kept wasting hours piecing together brand-voice docs for clients.</p>
          
          <p style="margin-bottom: 15px;">Seeing your order come through today honestly made my week. 🙌</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 15px 0; font-weight: 500;">If you have 2 minutes:</p>
            <ol style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">What problem were you hoping AI Style Guide would solve?</li>
              <li style="margin-bottom: 8px;">What nearly stopped you from buying?</li>
              <li style="margin-bottom: 0;">Anything else you wanna share :)</li>
            </ol>
          </div>
          
          <p style="margin-bottom: 15px;">And if you've got questions about AIStyleGuide, here's my direct Calendly link (15 min, no pitch):</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://calendly.com/l-gichigi/customer-chat" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              📅 Chat with Tahi (15 min)
            </a>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/full-access?session_id=${data.sessionId}" 
               style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              📖 Access Your Style Guide
            </a>
          </div>
          
          <p style="text-align: center; margin: 10px 0; font-size: 12px; color: #666;">
            💡 Open this link on the same device you used to create your style guide
          </p>
          
          <p style="margin-bottom: 15px;">Thanks again for being one of our very first customers. Anything you need, just hit reply — it's really me on the other end.</p>
          
          <p style="margin-bottom: 5px;">Cheers,<br>
          Tahi<br>
          Founder, AI Style Guide<br>
          <a href="https://x.com/tahigichigi" style="color: #2563eb;">x.com/tahigichigi</a></p>
          
        </body>
      </html>
    `;
  }

  private generateThankYouEmailText(data: ThankYouEmailData): string {
    const firstName = data.customerName ? data.customerName.split(' ')[0] : 'there';
    
    return `Hey ${firstName},

I'm Tahi — I built AI Style Guide because I kept wasting hours piecing together brand-voice docs for clients.

Seeing your order come through today honestly made my week. 🙌

If you have 2 minutes:
1. What problem were you hoping AI Style Guide would solve?
2. What nearly stopped you from buying?
3. Anything else you wanna share :)

And if you've got questions about AIStyleGuide, here's my direct Calendly link (15 min, no pitch): https://calendly.com/l-gichigi/customer-chat

📖 Access your style guide: ${process.env.NEXT_PUBLIC_APP_URL}/full-access?session_id=${data.sessionId}

💡 Open this link on the same device you used to create your style guide

Thanks again for being one of our very first customers. Anything you need, just hit reply — it's really me on the other end.

Cheers,
Tahi
Founder, AI Style Guide
x.com/tahigichigi`;
  }

  private generateAbandonedCartEmailHTML(data: AbandonedCartEmailData): string {
    const firstName = data.customerName ? data.customerName.split(' ')[0] : '';
    const greeting = firstName ? `Hey ${firstName}` : 'Hey there';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>I get it - take your time</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #374151; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          
          <div style="margin-bottom: 40px;">
            <p style="font-size: 16px; margin-bottom: 20px;">${greeting},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">I noticed you started creating your style guide but didn't finish. Totally get it - big decisions take time.</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Here's 20% off when you're ready: <strong style="color: #059669;">COMEBACK20</strong></p>
            
            <p style="font-size: 14px; margin-bottom: 20px; color: #6b7280;">Just add the code at checkout.</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">No pressure, just wanted to make sure you had it.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.recoveryUrl}" 
                 style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
                Generate Your Style Guide
              </a>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; margin-top: 30px;">
            <p style="font-size: 16px; margin-bottom: 5px; color: #374151;">Tahi</p>
            <p style="font-size: 14px; margin-bottom: 2px; color: #6b7280;">Founder, AI Style Guide</p>
            <p style="font-size: 14px; margin-bottom: 0; color: #6b7280;">
              <a href="https://x.com/tahigichigi" style="color: #6b7280; text-decoration: none;">x.com/tahigichigi</a>
            </p>
          </div>
          
        </body>
      </html>
    `;
  }

  private generateAbandonedCartEmailText(data: AbandonedCartEmailData): string {
    const firstName = data.customerName ? data.customerName.split(' ')[0] : '';
    const greeting = firstName ? `Hey ${firstName}` : 'Hey there';
    
    return `
${greeting},

I noticed you started creating your style guide but didn't finish. Totally get it - big decisions take time.

Here's 20% off when you're ready: COMEBACK20

Just add the code at checkout.

No pressure, just wanted to make sure you had it.

Generate your style guide: ${data.recoveryUrl}

Tahi
Founder, AI Style Guide
x.com/tahigichigi
    `;
  }
}

export const emailService = new EmailService();
